//! High-performance vector similarity & Top-K nearest neighbor search in Rust.
//!
//! Provides zero-overhead cosine similarity and ranked nearest-neighbor search
//! to accelerate Openzess memory recall and semantic context pruning.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct CandidateVector {
    pub id: String,
    pub vector: Vec<f32>,
    #[serde(default)]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct TopKRequest {
    pub query: Vec<f32>,
    pub candidates: Vec<CandidateVector>,
    #[serde(default = "default_top_k")]
    pub top_k: usize,
}

fn default_top_k() -> usize {
    5
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct ScoredItem {
    pub id: String,
    pub score: f32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct TopKResponse {
    pub results: Vec<ScoredItem>,
    pub total_evaluated: usize,
}

/// Compute cosine similarity between two f32 slices.
/// Returns a score in [-1.0, 1.0], or 0.0 if vectors have zero norm or mismatched lengths.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.is_empty() || a.len() != b.len() {
        return 0.0;
    }

    let mut dot_product = 0.0f32;
    let mut norm_a_sq = 0.0f32;
    let mut norm_b_sq = 0.0f32;

    for (x, y) in a.iter().zip(b.iter()) {
        dot_product += x * y;
        norm_a_sq += x * x;
        norm_b_sq += y * y;
    }

    if norm_a_sq == 0.0 || norm_b_sq == 0.0 {
        return 0.0;
    }

    let similarity = dot_product / (norm_a_sq.sqrt() * norm_b_sq.sqrt());
    similarity.clamp(-1.0, 1.0)
}

/// Rank candidate vectors against the query vector and return the top-K highest scoring items.
pub fn compute_top_k(mut req: TopKRequest) -> TopKResponse {
    let total = req.candidates.len();
    if req.query.is_empty() || total == 0 {
        return TopKResponse {
            results: Vec::new(),
            total_evaluated: 0,
        };
    }

    let mut scored: Vec<ScoredItem> = req
        .candidates
        .drain(..)
        .map(|c| {
            let score = cosine_similarity(&req.query, &c.vector);
            ScoredItem {
                id: c.id,
                score,
                metadata: c.metadata,
            }
        })
        .collect();

    // Sort descending by score (handling NaNs gracefully)
    scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

    if req.top_k > 0 && scored.len() > req.top_k {
        scored.truncate(req.top_k);
    }

    TopKResponse {
        results: scored,
        total_evaluated: total,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_cosine_similarity_identical() {
        let v1 = vec![1.0, 2.0, 3.0];
        let v2 = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&v1, &v2);
        assert!((sim - 1.0).abs() < 1e-5);
    }

    #[test]
    fn test_cosine_similarity_orthogonal() {
        let v1 = vec![1.0, 0.0];
        let v2 = vec![0.0, 1.0];
        let sim = cosine_similarity(&v1, &v2);
        assert!((sim - 0.0).abs() < 1e-5);
    }

    #[test]
    fn test_top_k_ranking() {
        let query = vec![1.0, 0.0, 0.0];
        let candidates = vec![
            CandidateVector {
                id: "doc1".into(),
                vector: vec![0.0, 1.0, 0.0],
                metadata: Some(json!({"tag": "other"})),
            },
            CandidateVector {
                id: "doc2".into(),
                vector: vec![0.9, 0.1, 0.0],
                metadata: Some(json!({"tag": "close"})),
            },
            CandidateVector {
                id: "doc3".into(),
                vector: vec![1.0, 0.0, 0.0],
                metadata: Some(json!({"tag": "exact"})),
            },
        ];

        let req = TopKRequest {
            query,
            candidates,
            top_k: 2,
        };

        let res = compute_top_k(req);
        assert_eq!(res.total_evaluated, 3);
        assert_eq!(res.results.len(), 2);
        assert_eq!(res.results[0].id, "doc3");
        assert_eq!(res.results[1].id, "doc2");
    }
}
