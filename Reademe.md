# App Icons

To add custom icons for your application, place the following files in the `assets/` directory:

## Required Icon Files

### Windows

* `icon.ico` - Windows icon file (256x256 recommended)

### macOS

* `icon.icns` - macOS icon file

### Linux

* `icon.png` - PNG icon file (512x512 recommended)

## Creating Icons

### From PNG to ICO (Windows)

You can use online tools like:

* https://icoconvert.com/
* https://convertio.co/png-ico/

### From PNG to ICNS (macOS)

On macOS, use the following commands:

```bash
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
rm -R icon.iconset
```

## Default Behavior

If you don't provide custom icons, Electron will use its default icon. The app will still work perfectly, but with a generic appearance.

## Recommended Icon Design

For a Docker management app, consider:

* Docker whale logo
* Container/box imagery
* Terminal/command line elements
* Blue/purple color scheme (matching Docker branding)

You can create icons using:

* Adobe Illustrator / Photoshop
* GIMP (free)
* Inkscape (free)
* Figma (free for personal use)
