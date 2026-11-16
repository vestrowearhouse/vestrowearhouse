import os
import base64
import shutil

project_dir = r"D:\VestroWearHouse\Stellar Mart BD"
tab_icon_path = os.path.join(project_dir, "public", "tab-icon.png")

with open(tab_icon_path, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#ffffff" rx="96" />
  <image href="data:image/png;base64,{b64}" x="32" y="32" width="448" height="448" />
</svg>"""

with open(os.path.join(project_dir, "public", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)
with open(os.path.join(project_dir, "app", "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)

for target in [
    os.path.join(project_dir, "app", "icon.png"),
    os.path.join(project_dir, "public", "icon.png"),
    os.path.join(project_dir, "public", "favicon-32x32.png"),
    os.path.join(project_dir, "public", "favicon-16x16.png"),
    os.path.join(project_dir, "public", "favicon-48x48.png"),
    os.path.join(project_dir, "public", "apple-touch-icon.png"),
    os.path.join(project_dir, "public", "icons", "apple-touch-icon.png"),
    os.path.join(project_dir, "public", "icons", "icon-192x192.png"),
    os.path.join(project_dir, "public", "icons", "icon-512x512.png"),
    os.path.join(project_dir, "public", "icons", "maskable-icon-192x192.png"),
    os.path.join(project_dir, "public", "icons", "maskable-icon-512x512.png"),
]:
    shutil.copyfile(tab_icon_path, target)

try:
    from PIL import Image
    img = Image.open(tab_icon_path)
    img.save(os.path.join(project_dir, "public", "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])
    img.save(os.path.join(project_dir, "app", "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64)])
    print("ICO generated with PIL successfully")
except Exception as e:
    print("PIL fallback:", e)
    shutil.copyfile(tab_icon_path, os.path.join(project_dir, "public", "favicon.ico"))
    shutil.copyfile(tab_icon_path, os.path.join(project_dir, "app", "favicon.ico"))

print("All favicon, tab icon, and app icon files updated successfully!")
