//! Codebase token estimation and symbol scanner in Rust.
//!
//! Provides lightning-fast token, line, character, and symbol metrics
//! to help Openzess prune prompts and enforce context limits.

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CodeStatsRequest {
    pub text: String,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct CodeStatsResponse {
    pub char_count: usize,
    pub word_count: usize,
    pub line_count: usize,
    pub non_empty_lines: usize,
    /// Fast BPE/Word-piece approximation: ~4 characters per token in code/text.
    pub estimated_tokens: usize,
    /// Basic bracket/brace balance check (useful for code validity checks)
    pub is_balanced: bool,
}

pub fn analyze_code(req: CodeStatsRequest) -> CodeStatsResponse {
    let text = &req.text;
    let char_count = text.chars().count();
    let word_count = text.split_whitespace().count();
    let line_count = text.lines().count();
    let non_empty_lines = text.lines().filter(|l| !l.trim().is_empty()).count();

    // Fast heuristic token estimation:
    // Uses max of whitespace tokens and byte-length / 3.8
    let approx_by_chars = (char_count as f64 / 3.8).ceil() as usize;
    let estimated_tokens = word_count.max(approx_by_chars);

    // Balanced delimiter check for code sanity
    let mut stack = Vec::new();
    let mut is_balanced = true;

    for ch in text.chars() {
        match ch {
            '(' | '[' | '{' => stack.push(ch),
            ')' => {
                if stack.pop() != Some('(') {
                    is_balanced = false;
                    break;
                }
            }
            ']' => {
                if stack.pop() != Some('[') {
                    is_balanced = false;
                    break;
                }
            }
            '}' => {
                if stack.pop() != Some('{') {
                    is_balanced = false;
                    break;
                }
            }
            _ => {}
        }
    }

    if !stack.is_empty() {
        is_balanced = false;
    }

    CodeStatsResponse {
        char_count,
        word_count,
        line_count,
        non_empty_lines,
        estimated_tokens,
        is_balanced,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_code_stats_basic() {
        let code = "fn main() {\n    println!(\"hello\");\n}\n";
        let res = analyze_code(CodeStatsRequest {
            text: code.to_string(),
        });
        assert_eq!(res.line_count, 3);
        assert_eq!(res.non_empty_lines, 3);
        assert!(res.is_balanced);
        assert!(res.estimated_tokens > 0);
    }

    #[test]
    fn test_unbalanced_code() {
        let code = "function test() { return 1;";
        let res = analyze_code(CodeStatsRequest {
            text: code.to_string(),
        });
        assert!(!res.is_balanced);
    }
}
