# Phase 1 Data Model: User Profiles & Customization

## 1. Database Entities

### `users` Table Extensions
| Column Name | Type | Constraints | Description |
|---|---|---|---|
| `id` | String | Primary Key | UUID string |
| `email` | String | Unique, Index | User email |
| `username` | String | Unique, Index | User handle |
| `password_hash` | String | Not Null | Bcrypt hashed password |
| `display_name` | String(100) | Nullable | Friendly name (defaults to username if null) |
| `avatar_url` | String(500) | Nullable | Avatar image URL or avatar preset identifier |
| `bio` | Text | Nullable | User self-description or role |
| `preferences_json`| Text | Nullable | JSON string: `{"theme": "dark", "persona": "architect", ...}` |
| `is_admin` | Integer | Default 0 | Admin permission flag |
| `is_active` | Integer | Default 1 | Active status flag |
| `created_at` | DateTime | Index | Timestamp created |
| `last_login_at` | DateTime | Nullable | Last authenticated timestamp |

---

## 2. Pydantic Schemas

```python
class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class ProfileResponse(BaseModel):
    id: str
    email: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Dict[str, Any]
    is_admin: bool
    created_at: str
```
