# 💾 OpenZess — Saved Chat Archive (`saved_chats/`)

This directory contains persistent, exported records of OpenZess design sessions, architectural audits, DevOps parity runs, and user conversations.

---

## 📂 Archived Sessions

| Date | File | Primary Topics | Status |
|---|---|---|---|
| **2026-10-02** | [`2026-10-02_auto_approve_sandbox_escalation_devops.md`](./2026-10-02_auto_approve_sandbox_escalation_devops.md) | Auto-Approve Feature, Sandbox Escalation Defense, DevOps Zero Clippy Warnings, Latency Optimization | ✅ Completed |

---

## 🛡️ Security Standard: Auto-Approve & Sandbox Escalation

OpenZess features an autonomous tool execution mode with strict security bounds:

> **"Auto-approve is enabled. Permission prompts will be approved automatically. Sandbox escalation prompts are always excluded."**

### Sandbox Escalation Defenses:
- **Privilege Escalation:** `sudo`, `doas`, `runas`, `su -`, `gsudo`, `Start-Process -Verb RunAs`, PowerShell ExecutionPolicy bypass.
- **Destructive Filesystem Actions:** `format`, `rm -rf /`, `del /s /q`, `rmdir /s /q`, `mkfs`, `dd if=`, `diskpart`.
- **Protected Credentials & Paths:** `.ssh`, `id_rsa`, `id_ed25519`, `/etc/shadow`, `/etc/passwd`, `windows/system32`, `SAM`.
- **Remote Injections & Reverse Shells:** `curl ... | bash`, `wget ... | sh`, `nc -e`, `/dev/tcp/`.
