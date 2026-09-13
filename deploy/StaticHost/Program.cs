// Minimal static-file host for the Expo web export. The deploy script copies `dist/` (from
// `npx expo export --platform web`) into wwwroot/ before `dotnet publish` runs. Exists only so
// the pre-built React Native Web bundle can run on this App Service's existing DOTNETCORE|10.0
// stack without changing the Azure runtime/plan — it serves no API of its own.
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

// Client-side routing (React Navigation) needs every unmatched path to fall back to index.html.
app.MapFallbackToFile("index.html");

app.Run();
