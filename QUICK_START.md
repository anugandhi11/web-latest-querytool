# ⚡ Quick Start Guide - Web Query Tool

**Get started in 5 minutes!**

---

## 🎯 What You Have Now

✅ **Phase 1-4 Complete** (57% of project)
- Angular 19 frontend with Monaco Editor (VS Code's SQL editor)
- .NET 9 backend with Clean Architecture
- **CRITICAL**: Imperva WAF bypass via Base64 encoding
- AG Grid for enterprise data display

---

## 🚀 Running the Application

### **Step 1: Start Frontend (Angular 19)**

```bash
cd web-query-tool
npm install         # If not already done
ng serve

# ✅ App running at: http://localhost:4200
```

### **Step 2: Start Backend (.NET 9 API)**

```bash
cd WebQueryTool/WebQueryTool.API
dotnet run

# ✅ API running at: https://localhost:5001
# ✅ Swagger UI at: https://localhost:5001/swagger
```

### **Step 3: Open Browser**

Navigate to: **http://localhost:4200**

You'll see:
- 🎨 Beautiful SQL Editor (Monaco Editor - VS Code powered)
- 📊 Data Grid (AG Grid - NASA grade)
- ⚡ Real-time query execution

---

## 🧪 Testing the Application

### **Test 1: Execute a Query**

1. Open http://localhost:4200
2. In the SQL editor, type:
   ```sql
   SELECT * FROM employees
   ```
3. Press `Ctrl+Enter` or click "Run Query"
4. See results in the data grid below

**Note**: Currently returns mock data - connect to real database in Phase 5

### **Test 2: Test WAF Bypass (CRITICAL)**

```bash
# Test Base64 encoding
ENCODED=$(echo -n "SELECT * FROM users" | base64)
echo "Encoded SQL: $ENCODED"

# Call API
curl -X POST https://localhost:5001/api/v1/query/execute \
  -H "Content-Type: application/json" \
  -d "{\"queryEncoded\": \"$ENCODED\", \"connectionId\": \"test-conn\", \"executionOptions\": {\"maxRows\": 1000, \"timeout\": 30}}"

# Should return: 200 OK with mock data
```

### **Test 3: Explore Monaco Editor Features**

**Keyboard Shortcuts**:
- `Ctrl+Enter` - Execute query
- `Ctrl+/` - Toggle line comment
- `Shift+Alt+F` - Format SQL code
- `Ctrl+Space` - Trigger IntelliSense

**Features**:
- SQL syntax highlighting
- Auto-complete for SQL keywords
- Line numbers and minimap
- Code folding

### **Test 4: Explore AG Grid Features**

**Features**:
- Click column headers to sort
- Use filter icon to filter data
- Drag column edges to resize
- Click "Export CSV" to download
- Click "Auto-size Columns" to fit

---

## 📁 Project Structure Quick Reference

```
web-latest-querytool/
│
├── web-query-tool/                 # Angular 19 Frontend
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   └── query-execution.service.ts  # ⚠️ WAF Bypass Logic
│   │   │   └── models/
│   │   │       └── query.models.ts
│   │   │
│   │   └── features/
│   │       ├── sql-editor/
│   │       │   └── components/
│   │       │       ├── monaco-sql-editor.component.ts   # SQL Editor
│   │       │       └── sql-editor-page.component.ts     # Main Page
│   │       │
│   │       └── data-grid/
│   │           └── components/
│   │               └── query-results-grid.component.ts   # Data Grid
│   │
│   ├── package.json
│   └── angular.json
│
├── WebQueryTool/                   # .NET 9 Backend
│   ├── WebQueryTool.API/
│   │   ├── Controllers/
│   │   │   └── QueryController.cs  # ⚠️ Base64 Decoding
│   │   └── Program.cs
│   │
│   └── WebQueryTool.Application/
│       └── DTOs/
│           └── QueryRequestDto.cs  # Contains queryEncoded field
│
├── README.md                       # Full documentation
├── PROJECT_SUMMARY.md              # Detailed progress report
└── QUICK_START.md                  # This file
```

---

## 🔑 Key Files to Understand

### **1. query-execution.service.ts** (Frontend)
```typescript
// This service encodes SQL to Base64 before sending to API
executeQuery(sql: string): Observable<QueryResult> {
  const encodedSQL = btoa(sql);  // ⚠️ WAF Bypass
  return this.http.post('/api/query/execute', {
    queryEncoded: encodedSQL
  });
}
```

### **2. QueryController.cs** (Backend)
```csharp
// This controller decodes Base64 back to SQL
[HttpPost("execute")]
public async Task<QueryResult> ExecuteQuery(QueryRequestDto request)
{
    // Decode Base64
    var sql = Encoding.UTF8.GetString(
        Convert.FromBase64String(request.QueryEncoded)
    );

    // Execute query (currently returns mock data)
    return await ExecuteQueryMock(sql);
}
```

### **3. monaco-sql-editor.component.ts** (Frontend)
```typescript
// Monaco Editor initialization with SQL support
this.editor = monaco.editor.create(container, {
  value: 'SELECT * FROM ',
  language: 'pgsql',
  theme: 'vs-dark',
  // ... SQL IntelliSense enabled
});
```

### **4. query-results-grid.component.ts** (Frontend)
```typescript
// AG Grid with enterprise features
displayQueryResults(result: QueryResult) {
  this.columnDefs.set(this.generateColumns(result));
  this.rowData.set(result.rows);
}
```

---

## 🎓 What Each Library Does

### **Monaco Editor (0.52.0)**
- **What**: VS Code's editor engine
- **Why**: 10M+ developers use it daily
- **Features**: SQL IntelliSense, syntax highlighting, keyboard shortcuts

### **monaco-sql-languages (0.11.0)**
- **What**: SQL language support for Monaco
- **Why**: Provides SQL-specific autocomplete
- **Features**: PostgreSQL, MySQL, SQL Server dialects

### **AG Grid (34.3.1)**
- **What**: Enterprise data grid
- **Why**: Used by NASA, JP Morgan, MongoDB
- **Features**: Virtual scrolling, Excel export, millions of rows

### **@microsoft/signalr (8.0.7)**
- **What**: Real-time WebSocket library
- **Why**: Microsoft official, automatic reconnection
- **Status**: Planned for Phase 5

---

## 🔧 Common Issues & Solutions

### **Issue 1: Port Already in Use**

```bash
# Frontend (Angular)
Error: Port 4200 is already in use

# Solution:
ng serve --port 4201
```

```bash
# Backend (.NET)
Error: Address already in use: ':::5001'

# Solution:
dotnet run --urls "https://localhost:5002"
```

### **Issue 2: CORS Error**

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution**: Update `WebQueryTool/WebQueryTool.API/Program.cs`:

```csharp
app.UseCors(policy => policy
    .WithOrigins("http://localhost:4200")  // ✅ Match your frontend port
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

### **Issue 3: Monaco Editor Not Loading**

```
Monaco Editor assets not found
```

**Solution**: Verify `web-query-tool/angular.json` contains:

```json
"assets": [
  {
    "glob": "**/*",
    "input": "node_modules/monaco-editor",
    "output": "/assets/monaco-editor/"
  }
]
```

### **Issue 4: AG Grid License Warning**

```
AG Grid: License key not found
```

**Solution**: This is normal for Community edition. Ignore or purchase Enterprise license.

---

## 📊 Current Limitations

| Feature | Status | Workaround |
|---------|--------|------------|
| Real Database Connection | ❌ Not Implemented | Returns mock data |
| SignalR Real-time | ❌ Not Implemented | Planned Phase 5 |
| JWT Authentication | ❌ Not Implemented | Planned Phase 6 |
| Excel Export | ⚠️ Enterprise Only | Use CSV export |

---

## 🚧 Next Development Steps

### **Phase 5: SignalR Real-time (Next)**

**Goal**: Real-time query execution with progress updates

**Tasks**:
1. Create SignalR Hub in .NET backend
2. Implement WebSocket service in Angular
3. Add query progress UI
4. Implement query cancellation

**Estimated Time**: 2-3 days

### **Phase 6: Authentication & Security**

**Goal**: Secure API with JWT authentication

**Tasks**:
1. Implement JWT token generation
2. Add auth guards in Angular
3. Create HTTP interceptor
4. Implement role-based authorization

**Estimated Time**: 2-3 days

### **Phase 7: Deployment & Optimization**

**Goal**: Production-ready deployment

**Tasks**:
1. Create Docker containers
2. Kubernetes manifests
3. Optimize bundle sizes
4. Performance testing

**Estimated Time**: 2-3 days

---

## 💡 Pro Tips

### **Frontend Development**

```bash
# Run tests
cd web-query-tool
ng test

# Build for production
ng build --configuration production

# Analyze bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/web-query-tool/stats.json
```

### **Backend Development**

```bash
# Run tests
cd WebQueryTool
dotnet test

# Watch mode (auto-reload)
dotnet watch run

# Build for production
dotnet publish -c Release
```

### **Monaco Editor Customization**

Change theme in `monaco-sql-editor.component.ts`:

```typescript
theme: 'vs-dark',      // Dark theme (current)
// theme: 'vs',        // Light theme
// theme: 'hc-black',  // High contrast
```

### **AG Grid Customization**

Change page size in `query-results-grid.component.ts`:

```typescript
paginationPageSize: 100,  // Default (current)
// paginationPageSize: 50,   // Smaller pages
// paginationPageSize: 500,  // Larger pages
```

---

## 📚 Additional Resources

### **Documentation**
- Full README: `README.md`
- Project Summary: `PROJECT_SUMMARY.md`
- Angular Docs: https://angular.dev
- .NET Docs: https://learn.microsoft.com/aspnet/core
- Monaco Editor: https://microsoft.github.io/monaco-editor
- AG Grid: https://www.ag-grid.com

### **Video Tutorials** (Recommended)
- Monaco Editor Integration: https://www.youtube.com/watch?v=... (search YouTube)
- AG Grid Angular Setup: https://www.ag-grid.com/angular-data-grid/getting-started
- SignalR Tutorial: https://learn.microsoft.com/aspnet/core/tutorials/signalr

---

## 🎉 Congratulations!

You now have a **production-quality foundation** for a web query tool with:

✅ **VS Code-powered SQL editor**
✅ **NASA-grade data grid**
✅ **WAF-compatible architecture**
✅ **Clean, maintainable code**
✅ **Comprehensive documentation**

**Next**: Continue with Phase 5 (SignalR) or customize the existing features!

---

**Questions?** Check the full `README.md` or reach out to the team.

**Happy Coding!** 🚀
