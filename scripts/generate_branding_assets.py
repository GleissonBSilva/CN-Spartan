import os
from PIL import Image, ImageOps, ImageDraw

def main():
    src_path = 'Logo/Logo Cine Spartan.jpg'
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found!")
        return

    src_img = Image.open(src_path).convert('RGB')
    src_w, src_h = src_img.size
    bg_rgb = (14, 15, 20) # #0E0F14

    # Cropped logo for icons and centered displays
    # Active logo content bounding area
    crop_box = (550, 160, 2250, 1330)
    logo_crop = src_img.crop(crop_box)
    cw, ch = logo_crop.size

    # 1. Update public branding assets
    os.makedirs('public', exist_ok=True)
    # 16:9 logo
    logo_16_9 = ImageOps.fit(src_img, (1920, 1080), method=Image.Resampling.LANCZOS)
    logo_16_9.save('public/logo-cinespartan.jpg', quality=95)
    logo_16_9.save('public/logo-cinespartan.png')

    # Square icon
    sq_size = 512
    sq_icon = Image.new('RGB', (sq_size, sq_size), bg_rgb)
    scale = (sq_size * 0.72) / max(cw, ch)
    new_w, new_h = int(cw * scale), int(ch * scale)
    scaled_logo = logo_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    sq_icon.paste(scaled_logo, ((sq_size - new_w) // 2, (sq_size - new_h) // 2))
    sq_icon.save('public/logo-icon.jpg', quality=95)
    sq_icon.save('public/logo-icon.png')
    print("Updated public/ branding assets.")

    # 2. Android TV Banner (16:9)
    res_dir = 'android/app/src/main/res'
    banner_dir = os.path.join(res_dir, 'drawable')
    os.makedirs(banner_dir, exist_ok=True)
    banner_img = ImageOps.fit(src_img, (1920, 1080), method=Image.Resampling.LANCZOS)
    banner_img.save(os.path.join(banner_dir, 'banner.png'))

    # Also save banner in drawable-xhdpi (320x180 standard TV Leanback)
    for folder, (bw, bh) in [
        ('drawable-mdpi', (160, 90)),
        ('drawable-hdpi', (240, 135)),
        ('drawable-xhdpi', (320, 180)),
        ('drawable-xxhdpi', (640, 360))
    ]:
        b_folder = os.path.join(res_dir, folder)
        os.makedirs(b_folder, exist_ok=True)
        b_scaled = ImageOps.fit(src_img, (bw, bh), method=Image.Resampling.LANCZOS)
        b_scaled.save(os.path.join(b_folder, 'banner.png'))
    print("Created Android TV Leanback banners.")

    # 3. Android Splash Screens
    # Default splash
    splash_default = ImageOps.fit(src_img, (1920, 1080), method=Image.Resampling.LANCZOS)
    splash_default.save(os.path.join(banner_dir, 'splash.png'))

    # Landscape splash screens (TV Box and landscape phones)
    land_sizes = {
        'drawable-land-mdpi': (480, 320),
        'drawable-land-hdpi': (800, 480),
        'drawable-land-xhdpi': (1280, 720),
        'drawable-land-xxhdpi': (1600, 960),
        'drawable-land-xxxhdpi': (1920, 1080),
    }
    for folder, (sw, sh) in land_sizes.items():
        f_dir = os.path.join(res_dir, folder)
        os.makedirs(f_dir, exist_ok=True)
        s_img = ImageOps.fit(src_img, (sw, sh), method=Image.Resampling.LANCZOS)
        s_img.save(os.path.join(f_dir, 'splash.png'))

    # Portrait splash screens (Phones)
    port_sizes = {
        'drawable-port-mdpi': (320, 480),
        'drawable-port-hdpi': (480, 800),
        'drawable-port-xhdpi': (720, 1280),
        'drawable-port-xxhdpi': (960, 1600),
        'drawable-port-xxxhdpi': (1280, 1920),
    }
    for folder, (sw, sh) in port_sizes.items():
        f_dir = os.path.join(res_dir, folder)
        os.makedirs(f_dir, exist_ok=True)
        p_canvas = Image.new('RGB', (sw, sh), bg_rgb)
        # Scale logo to fit ~75% of width
        p_scale = (sw * 0.75) / cw
        pw, ph = int(cw * p_scale), int(ch * p_scale)
        p_logo = logo_crop.resize((pw, ph), Image.Resampling.LANCZOS)
        p_canvas.paste(p_logo, ((sw - pw) // 2, (sh - ph) // 2))
        p_canvas.save(os.path.join(f_dir, 'splash.png'))
    print("Created Android Landscape and Portrait splash screens.")

    # 4. Android App Launcher Icons & Adaptive Icons
    # mipmap sizes:
    # mdpi: 48, fg: 108
    # hdpi: 72, fg: 162
    # xhdpi: 96, fg: 216
    # xxhdpi: 144, fg: 324
    # xxxhdpi: 192, fg: 432
    mipmap_configs = {
        'mipmap-mdpi': {'icon': 48, 'fg': 108},
        'mipmap-hdpi': {'icon': 72, 'fg': 162},
        'mipmap-xhdpi': {'icon': 96, 'fg': 216},
        'mipmap-xxhdpi': {'icon': 144, 'fg': 324},
        'mipmap-xxxhdpi': {'icon': 192, 'fg': 432},
    }

    for folder, conf in mipmap_configs.items():
        m_dir = os.path.join(res_dir, folder)
        os.makedirs(m_dir, exist_ok=True)
        isz = conf['icon']
        fg_sz = conf['fg']

        # Square Icon
        sq_icon = Image.new('RGB', (isz, isz), bg_rgb)
        scale = (isz * 0.75) / max(cw, ch)
        iw, ih = int(cw * scale), int(ch * scale)
        s_logo = logo_crop.resize((iw, ih), Image.Resampling.LANCZOS)
        sq_icon.paste(s_logo, ((isz - iw) // 2, (isz - ih) // 2))
        sq_icon.save(os.path.join(m_dir, 'ic_launcher.png'))

        # Round Icon
        round_icon = Image.new('RGBA', (isz, isz), (0, 0, 0, 0))
        # Draw background circle
        draw = ImageDraw.Draw(round_icon)
        draw.ellipse((0, 0, isz - 1, isz - 1), fill=bg_rgb)
        # Paste scaled logo
        r_scale = (isz * 0.65) / max(cw, ch)
        rw, rh = int(cw * r_scale), int(ch * r_scale)
        r_logo = logo_crop.resize((rw, rh), Image.Resampling.LANCZOS)
        round_icon.paste(r_logo, ((isz - rw) // 2, (isz - rh) // 2))
        round_icon.save(os.path.join(m_dir, 'ic_launcher_round.png'))

        # Adaptive Foreground (transparent background, logo in safe center circle)
        fg_canvas = Image.new('RGBA', (fg_sz, fg_sz), (0, 0, 0, 0))
        # Safe zone is ~65% of fg_sz
        fg_scale = (fg_sz * 0.62) / max(cw, ch)
        fw, fh = int(cw * fg_scale), int(ch * fg_scale)
        fg_logo = logo_crop.resize((fw, fh), Image.Resampling.LANCZOS)
        fg_canvas.paste(fg_logo, ((fg_sz - fw) // 2, (fg_sz - fh) // 2))
        fg_canvas.save(os.path.join(m_dir, 'ic_launcher_foreground.png'))

    print("Created Android Launcher Icons and Adaptive Foregrounds.")

if __name__ == '__main__':
    main()
