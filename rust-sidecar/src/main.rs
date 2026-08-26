//! Openzess Rust sidecar.
//!
//! A tiny, high-performance Axum microservice exposing stateless, CPU-bound
//! helpers that the Python core can offload behind the `SIDECAR_URL` feature flag.
//! Fully optional: Openzess runs unchanged when this process is absent.

mod code_stats;
mod graph;
mod imaging;
mod vector;

use axum::{
    http::{header, HeaderMap, HeaderName, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let app = Router::new()
        .route("/health", get(health))
        .route("/image/encode", post(encode_image))
        .route("/graphify/report", post(graphify_report))
        .route("/graphify/path", post(graphify_path))
        .route("/vector/topk", post(vector_topk))
        .route("/code/stats", post(code_stats_handler));

    let addr: SocketAddr = SocketAddr::from(([127, 0, 0, 1], 8100));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .unwrap_or_else(|e| panic!("failed to bind {addr}: {e}"));

    tracing::info!("openzess-sidecar {} listening on http://{addr}", env!("CARGO_PKG_VERSION"));
    axum::serve(listener, app).await.expect("server error");
}

/// GET /health — liveness probe used by the Python client before first use.
async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "service": "openzess-sidecar",
        "version": env!("CARGO_PKG_VERSION"),
        "capabilities": [
            "image_encode",
            "graphify_report",
            "graphify_path",
            "vector_topk",
            "code_stats"
        ]
    }))
}

/// POST /image/encode — raw pixel payload in the request body, parameters in headers.
async fn encode_image(headers: HeaderMap, body: axum::body::Bytes) -> Response {
    let Some(width) = header_u64(&headers, "x-width") else {
        return bad_request("missing x-width header");
    };
    let Some(height) = header_u64(&headers, "x-height") else {
        return bad_request("missing x-height header");
    };
    if width == 0 || height == 0 || width > 16384 || height > 16384 {
        return bad_request("unreasonable dimensions");
    }

    let quality = header_u64(&headers, "x-quality")
        .unwrap_or(65)
        .clamp(1, 100) as u8;
    let format = header_str(&headers, "x-format").unwrap_or_else(|| "jpeg".into());
    let layout = header_str(&headers, "x-layout").unwrap_or_else(|| "bgrx".into());

    // Encoding is CPU-bound: keep it off the async reactor threads.
    let result = tokio::task::spawn_blocking(move || {
        imaging::encode(&body, width as u32, height as u32, &layout, &format, quality)
    })
    .await;

    match result {
        Ok(Ok((bytes, mime))) => (
            [
                (header::CONTENT_TYPE, mime),
                (
                    HeaderName::from_static("x-encoded-by"),
                    "rust-sidecar",
                ),
            ],
            bytes,
        )
            .into_response(),
        Ok(Err(msg)) => bad_request(&msg),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("encode task failed: {join_err}"),
        )
            .into_response(),
    }
}

/// POST /graphify/report — aggregate a Graphify knowledge-graph payload.
async fn graphify_report(Json(body): Json<serde_json::Value>) -> Response {
    let result = tokio::task::spawn_blocking(move || {
        let empty = Vec::new();
        let nodes = body
            .get("nodes")
            .and_then(|v| v.as_array())
            .unwrap_or(&empty);
        let links = body
            .get("links")
            .and_then(|v| v.as_array())
            .unwrap_or(&empty);

        let mut communities = std::collections::HashSet::new();
        for node in nodes {
            let community = node
                .get("community")
                .and_then(|v| v.as_i64())
                .unwrap_or(1);
            communities.insert(community);
        }

        serde_json::json!({
            "nodes": nodes.len(),
            "edges": links.len(),
            "communities": communities.len(),
        })
    })
    .await;

    match result {
        Ok(stats) => Json(stats).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("aggregation task failed: {join_err}"),
        )
            .into_response(),
    }
}

/// POST /graphify/path — find the shortest path between two nodes in a Graphify knowledge graph.
async fn graphify_path(Json(req): Json<graph::PathRequest>) -> Response {
    let result = tokio::task::spawn_blocking(move || graph::find_shortest_path(req)).await;
    match result {
        Ok(res) => Json(res).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("pathfinding task failed: {join_err}"),
        )
            .into_response(),
    }
}

/// POST /vector/topk — compute cosine similarity and return top-k nearest neighbors.
async fn vector_topk(Json(req): Json<vector::TopKRequest>) -> Response {
    let result = tokio::task::spawn_blocking(move || vector::compute_top_k(req)).await;
    match result {
        Ok(res) => Json(res).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("vector calculation failed: {join_err}"),
        )
            .into_response(),
    }
}

/// POST /code/stats — fast token estimation and code analysis.
async fn code_stats_handler(Json(req): Json<code_stats::CodeStatsRequest>) -> Response {
    let result = tokio::task::spawn_blocking(move || code_stats::analyze_code(req)).await;
    match result {
        Ok(res) => Json(res).into_response(),
        Err(join_err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("code analysis failed: {join_err}"),
        )
            .into_response(),
    }
}

// ── helpers ────────────────────────────────────────────────────────────────

fn header_u64(headers: &HeaderMap, name: &str) -> Option<u64> {
    headers.get(name)?.to_str().ok()?.trim().parse::<u64>().ok()
}

fn header_str(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)?
        .to_str()
        .ok()
        .map(|v| v.trim().to_ascii_lowercase())
}

fn bad_request(msg: &str) -> Response {
    (StatusCode::BAD_REQUEST, msg.to_string()).into_response()
}
