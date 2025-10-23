# Branch & Stage Deploy (Vercel)

1. **Create branch**
```bash
git checkout -b feature/exec-v2
```

2. **Commit generated changes**
```bash
git add -A && git commit -m "feat(exec-v2): staging exec reports v2"
```

3. **Push and open preview**
```bash
git push -u origin feature/exec-v2
```
Vercel will create a **Preview deployment** for this branch.

4. **Copy prod env to Preview** (Vercel UI → Project → Settings → Environment Variables → Copy from Production to Preview). Keep values identical for now.

5. **(Optional) Use staging DB**
Set `AZURE_SQL_CONNECTION_STRING` (Preview) to a staging DB to avoid touching prod data.

6. **Verify preview URL** loads `/exec` (new v2 UI). Production remains on main.
