"""Gera as imagens otimizadas do site a partir dos originais do WordPress.

Uso:  python scripts/images.py
Lê assets-src/wp-uploads/ e escreve WebP em src/assets/img/. Os banners do
WordPress tinham texto e logo gravados na imagem; aqui recortamos só a parte
fotográfica e o texto passa a ser HTML.
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src', 'wp-uploads')
OUT = os.path.join(ROOT, 'src', 'assets', 'img')

# nome de saída: (arquivo original, recorte (x0, y0, x1, y1) ou None, largura máxima)
JOBS = {
    # Home
    'home/socios': ('home-iplacecorpuy-socios-desk.jpg', (436, 34, 1258, 226), 822),
    'home/video': ('video-iplace-corp.jpg', None, 1000),
    # Faixas fotográficas do topo das páginas (sem o texto gravado)
    'hero/lanzamientos': ('iplace-corp-uy-lanzamientos-desk-min.jpg', (0, 0, 1920, 285), 1920),
    'hero/originales': ('banner-originales-desk-1.jpg', (0, 0, 1920, 300), 1920),
    'hero/productos': ('Produtos-desk-1.jpg', None, 859),
    # Quienes somos / Soluciones
    'fotos/equipo-mesa': ('quienes-somos-1.jpg', None, 800),
    'fotos/dispositivos': ('quienes-somos-2.jpg', None, 800),
    'fotos/especialista': ('quienes-somos-3.jpg', None, 800),
    'productos/familia-mac-menor': ('familiamac-menor.png', None, 1020),
    # Productos
    'productos/mac': ('Familia_mac_iplace.png', None, 1000),
    'productos/ipad': ('ipad_family-1.png', None, 1000),
    'productos/iphone': ('iPhone_14_Pro_iPhone_14_Family_Screen__WWEN_Easy-Resize.com-removebg-preview.png', None, 524),
    'productos/watch': ('Apple_Watch_Series_8.png', None, 1000),
    'productos/airpods': ('AirPods_Family_3.png', None, 1000),
    'productos/originales': ('productos-iplace-originais.png', None, 629),
    # iPad para empresas
    'ipad/hero': ('iPad_Pro_Family_Silver_Magic_Keyboard_Hero_2-up_Horizontal_US-EN_SCREEN.png', None, 1000),
    'ipad/pencil': ('pencil.png', None, 58),
    'ipad/keyboard': ('keyboard.png', None, 585),
    'ipad/familia': ('ipad_family.png', None, 500),
    # Originales iPlace
    'originales/marca': ('Originales_iPlace_UY.png', None, 300),
    'originales/marca-accesorios': ('accesorios2_Originales_iPlace_UY.png', None, 300),
    'originales/pampas': ('productos-originales-pampas.jpg', None, 630),
    'originales/sampa': ('productos-originales-sampa.jpg', None, 630),
    'originales/beaga': ('productos-originales-beaga.jpg', None, 630),
    'originales/noronha': ('productos-originales-noronha.jpg', None, 630),
    'originales/floripa': ('productos-originales-floripa.jpg', None, 630),
    'originales/fortaleza': ('productos-originales-fortaleza.jpg', None, 630),
    'originales/rio': ('productos-originales-rio.jpg', None, 630),
    'originales/celeste': ('productos-originales-celeste.jpg', None, 630),
    'originales/accesorios': ('productos-originales-accesorios.jpg', None, 630),
    'originales/logo-pampas': ('logo-linea-pampas.png', None, 315),
    'originales/logo-sampa': ('logo-linea-sampa.png', None, 324),
    'originales/logo-beaga': ('logo-linea-beaga.png', None, 304),
    'originales/logo-noronha': ('logo-linea-noronha.png', None, 325),
    'originales/logo-floripa': ('logo-linea-floripa.png', None, 326),
    'originales/logo-fortaleza': ('logo-linea-fortaleza-3.png', None, 477),
    'originales/logo-rio': ('logo-linea-rio.png', None, 272),
    'originales/logo-celeste': ('logo-linea-celeste.png', None, 287),
    # Equipo comercial
    'equipo/diego-coll': ('contato-foto-diego-iplace-2.png', None, 250),
    'equipo/marcos-de-pena': ('Design-sem-nome-96.png', None, 250),
}


def save(im, name, max_w):
    if im.width > max_w:
        im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    path = os.path.join(OUT, name + '.webp')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    lossless = im.mode == 'RGBA' and im.width <= 480  # logos das linhas
    im.save(path, 'WEBP', quality=82, method=6, lossless=lossless)
    return im.size, os.path.getsize(path)


def lockup(src, name, rgb):
    """Logo iPlace Corporativo | Premium Reseller na cor pedida, a partir do alfa do PNG original."""
    alpha = Image.open(os.path.join(SRC, src)).convert('RGBA').getchannel('A')
    im = Image.new('RGBA', alpha.size, rgb + (255,))
    im.putalpha(alpha)
    im = im.crop(alpha.getbbox())
    h = 160
    im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    path = os.path.join(OUT, 'brand', name + '.png')
    im.save(path, optimize=True)
    return im.size, os.path.getsize(path)


def og_image():
    """Imagem de compartilhamento 1200×630: produtos sobre preto e o logo no canto."""
    canvas = Image.new('RGB', (1200, 630), (0, 0, 0))
    products = Image.open(os.path.join(SRC, 'Produtos-desk-1.jpg')).convert('RGB')
    products = products.resize((1030, round(products.height * 1030 / products.width)), Image.LANCZOS)
    canvas.paste(products, ((1200 - products.width) // 2, 630 - products.height + 20))
    logo = Image.open(os.path.join(OUT, 'brand', 'corporativo-white.png'))
    logo = logo.resize((round(logo.width * 96 / logo.height), 96), Image.LANCZOS)
    canvas.paste(logo, (56, 48), logo)
    path = os.path.join(OUT, 'og-default.jpg')
    canvas.save(path, quality=85, optimize=True)
    return os.path.getsize(path)


if __name__ == '__main__':
    for name, (src, box, max_w) in JOBS.items():
        im = Image.open(os.path.join(SRC, src))
        im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
        if box:
            im = im.crop(box)
        size, b = save(im, name, max_w)
        print(f'{name:32} {size[0]}x{size[1]:<5} {b // 1024} KB')
    logo = 'logo_iPlace_Corporativo_PremiumReseller_negativo-02.png'
    print('brand/corporativo-white', *lockup(logo, 'corporativo-white', (255, 255, 255)))
    print('brand/corporativo-black', *lockup(logo, 'corporativo-black', (0, 0, 0)))
    print('og-default.jpg', og_image() // 1024, 'KB')
