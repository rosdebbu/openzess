//! Pixel conversion + JPEG/PNG encoding for the sidecar.
//!
//! Accepts the exact raw buffers produced by `mss` screen grabs in the Python
//! core (`sct_img.bgra`, layout `BGRX`) so the wire format stays trivial:
//! plain little-endian pixel rows, no container, no base64.

use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::PngEncoder;
use image::{DynamicImage, ImageBuffer, Rgb};
use std::io::Cursor;

/// Encode a raw pixel buffer into JPEG or PNG bytes.
///
/// Returns `(encoded_bytes, mime_type)` or a human-readable error string.
pub fn encode(
    raw: &[u8],
    width: u32,
    height: u32,
    layout: &str,
    format: &str,
    quality: u8,
) -> Result<(Vec<u8>, &'static str), String> {
    let (w, h) = (width as usize, height as usize);
    let bytes_per_px = match layout {
        "rgb" => 3,
        "rgba" | "bgra" | "bgrx" => 4,
        other => return Err(format!("unsupported x-layout: {other}")),
    };
    let expected = w.checked_mul(h).and_then(|n| n.checked_mul(bytes_per_px));
    let expected = match expected {
        Some(n) => n,
        None => return Err("dimensions overflow".into()),
    };
    if raw.len() < expected {
        return Err(format!(
            "payload too small: got {} bytes, need {} for {width}x{height} ({layout})",
            raw.len(),
            expected
        ));
    }

    // Normalize every supported layout into packed RGB.
    let rgb: Vec<u8> = match layout {
        "rgb" => raw[..expected].to_vec(),
        "rgba" => raw[..expected]
            .chunks_exact(4)
            .flat_map(|px| [px[0], px[1], px[2]])
            .collect(),
        // mss BGRA / BGRX share byte order B,G,R,X for RGB extraction.
        _ => raw[..expected]
            .chunks_exact(4)
            .flat_map(|px| [px[2], px[1], px[0]])
            .collect(),
    };

    let img = ImageBuffer::<Rgb<u8>, Vec<u8>>::from_raw(width, height, rgb)
        .ok_or_else(|| "buffer conversion failed".to_string())?;
    let dyn_img = DynamicImage::ImageRgb8(img);

    match format {
        "jpeg" | "jpg" => {
            let mut cursor = Cursor::new(Vec::with_capacity(expected / 4));
            let encoder = JpegEncoder::new_with_quality(&mut cursor, quality);
            dyn_img
                .write_with_encoder(encoder)
                .map_err(|e| format!("jpeg encode failed: {e}"))?;
            Ok((cursor.into_inner(), "image/jpeg"))
        }
        "png" => {
            let mut cursor = Cursor::new(Vec::with_capacity(expected / 2));
            let encoder = PngEncoder::new(&mut cursor);
            dyn_img
                .write_with_encoder(encoder)
                .map_err(|e| format!("png encode failed: {e}"))?;
            Ok((cursor.into_inner(), "image/png"))
        }
        other => Err(format!("unsupported x-format: {other}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 2x1 BGRX frame: red pixel then green pixel.
    fn sample_bgrx() -> Vec<u8> {
        vec![
            0, 0, 255, 255, // B,G,R,X  -> red
            0, 255, 0, 255, // B,G,R,X  -> green
        ]
    }

    #[test]
    fn jpeg_encode_roundtrip() {
        let (bytes, mime) = encode(&sample_bgrx(), 2, 1, "bgrx", "jpeg", 90).unwrap();
        assert_eq!(mime, "image/jpeg");
        assert!(bytes.starts_with(&[0xFF, 0xD8])); // JPEG SOI marker
    }

    #[test]
    fn png_encode_roundtrip() {
        let (bytes, mime) = encode(&sample_bgrx(), 2, 1, "bgrx", "png", 65).unwrap();
        assert_eq!(mime, "image/png");
        assert!(bytes.starts_with(&[0x89, b'P', b'N', b'G']));
    }

    #[test]
    fn rejects_short_payload() {
        assert!(encode(&[0, 0, 0], 2, 1, "bgrx", "jpeg", 65).is_err());
    }

    #[test]
    fn rejects_unknown_layout() {
        assert!(encode(&sample_bgrx(), 2, 1, "yuv", "jpeg", 65).is_err());
    }
}
