# .NET Integration Guide: Health Tech Iframe

To embed the Health Tech application into your .NET application, follow these steps depending on your technology stack (Blazor, ASP.NET Core MVC/Razor Pages).

## 1. Security Headers (Provider Side)

The Health Tech app must allow framing from your .NET application's domain. In production, ensure the following headers are set on the server hosting the React app:

```http
Content-Security-Policy: frame-ancestors 'self' https://your-dotnet-app-domain.com;
```
*Alternatively (Older browsers):*
```http
X-Frame-Options: ALLOW-FROM https://your-dotnet-app-domain.com
```

---

## 2. ASP.NET Core (Razor Pages / MVC)

Add the following to your View (`.cshtml`):

```html
<div class="health-tech-container">
    <iframe src="https://health-tech-app.com" 
            style="width: 100%; height: 800px; border: none;"
            title="Health Tech Integration"
            allow="microphone; camera; clipboard-write" 
            loading="lazy">
    </iframe>
</div>
```

---

## 3. Blazor (Server or WebAssembly)

You can create a simple wrapper component:

```razor
@* HealthTechIframe.razor *@

<div class="iframe-wrapper">
    <iframe src="@SourceUrl" 
            style="width: 100%; height: 800px; border: none;" 
            allow="microphone; camera; clipboard-write">
    </iframe>
</div>

@code {
    [Parameter]
    public string SourceUrl { get; set; } = "https://health-tech-app.com";
}
```

---

## 4. Communication (Optional)

If you need to pass data between the .NET app and the React app, use the `postMessage` API.

**In .NET (JavaScript Interop):**
```javascript
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage({ type: 'INIT_DATA', payload: { userId: 123 } }, '*');
```

**In React (App.tsx):**
```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'INIT_DATA') {
    console.log('Received data from .NET:', event.data.payload);
  }
});
```

> [!TIP]
> Always use a specific origin instead of `*` in production for security.
