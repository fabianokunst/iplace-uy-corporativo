"""Gera o favicon e os ícones do site a partir do logo iPlace.

Uso:  python scripts/favicons.py
Desenho: o "iP" do logo em branco, dentro do anel verde iPlace (aberto à esquerda,
como no logo), sobre fundo preto. O SVG e os PNG/ICO saem da mesma geometria.
Escreve em src/static/ (raiz do site) e em src/assets/img/brand/.
"""
import math
import os
import re
from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC = os.path.join(ROOT, 'src', 'static')
BRAND = os.path.join(ROOT, 'src', 'assets', 'img', 'brand')
LOGO_SRC = os.path.join(ROOT, 'assets-src', 'wp-uploads', 'iplace-corp-premium-copiar.png')

BLACK, WHITE, LIME = '#000000', '#FFFFFF', '#C8D400'
VIEW = 512           # viewBox do desenho
TILE_RADIUS = 112    # cantos do quadrado nos ícones com fundo transparente
RING_R, RING_W = 216, 36  # raio externo e espessura do anel
RING_GAP = 0.37      # meia-altura da abertura, em fração do raio (proporção do logo)
LETTER_SCALE = 2.0

# Letras "i" e "P" do logo iPlace (viewBox 512 do favicon antigo).
LETTERS = [
    'M56.1381 201.304C49.4024 201.304 43.9231 206.765 43.9231 213.48C43.9231 220.194 49.4024 225.657 56.1381 225.657'
    'C62.8736 225.657 68.3529 220.194 68.3529 213.48C68.3529 206.765 62.8736 201.304 56.1381 201.304Z',
    'M66.8519 231.225H45.6677V307.346H66.8519V231.225Z',
    'M138.886 246.742C137.246 247.924 135.431 248.795 133.477 249.351C131.487 249.873 129.533 250.151 127.648 250.151'
    'H106.778V218.945H127.927C130.231 218.945 132.395 219.189 134.419 219.64C136.338 220.093 138.048 220.893 139.48 222.041'
    'C140.945 223.189 142.097 224.755 142.969 226.738C143.842 228.79 144.296 231.4 144.296 234.531'
    'C144.296 237.557 143.772 240.062 142.795 242.045C141.782 243.993 140.491 245.559 138.886 246.742Z'
    'M158.465 212.995C155.812 209.656 152.044 206.838 147.192 204.646C142.376 202.454 136.129 201.341 128.625 201.341'
    'H85.7336V307.346H106.743V267.79H128.625C136.164 267.79 142.376 266.712 147.192 264.555'
    'C152.044 262.398 155.812 259.614 158.465 256.274C161.082 252.934 162.932 249.282 163.874 245.385'
    'C164.816 241.593 165.305 237.975 165.305 234.704C165.305 231.434 164.816 227.817 163.874 223.954'
    'C162.932 219.988 161.117 216.301 158.465 212.995Z',
]
LETTERS_BOX = (43.9231, 201.304, 165.305, 307.346)  # x0, y0, x1, y1


def parse_path(d):
    """Subcaminhos de um path SVG com M/L/H/V/C/Z absolutos, curvas achatadas em pontos."""
    tokens = re.findall(r'[MLHVCZ]|-?\d*\.?\d+', d)
    subpaths, points, x, y, cmd, i = [], [], 0.0, 0.0, None, 0
    while i < len(tokens):
        if tokens[i].isalpha():
            cmd = tokens[i]
            i += 1
            if cmd == 'Z':
                subpaths.append(points)
                points = []
                continue
        nums = lambda n: [float(t) for t in tokens[i:i + n]]
        if cmd == 'M' or cmd == 'L':
            x, y = nums(2); i += 2
            points.append((x, y))
        elif cmd == 'H':
            x = nums(1)[0]; i += 1
            points.append((x, y))
        elif cmd == 'V':
            y = nums(1)[0]; i += 1
            points.append((x, y))
        elif cmd == 'C':
            x1, y1, x2, y2, x3, y3 = nums(6); i += 6
            for s in range(1, 17):
                t = s / 16
                u = 1 - t
                points.append((u**3 * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3,
                               u**3 * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3))
            x, y = x3, y3
    if points:
        subpaths.append(points)
    return subpaths


def letters_transform():
    """Escala o "iP" e centraliza no desenho."""
    x0, y0, x1, y1 = LETTERS_BOX
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return lambda p: (VIEW / 2 + (p[0] - cx) * LETTER_SCALE, VIEW / 2 + (p[1] - cy) * LETTER_SCALE)


def ring_points(steps=180):
    """Anel aberto à esquerda, com cortes horizontais nas pontas como no logo."""
    c, r_out, r_in = VIEW / 2, RING_R, RING_R - RING_W
    h = RING_GAP * RING_R
    a_out, a_in = math.asin(h / r_out), math.asin(h / r_in)
    # Ângulos medidos a partir da esquerda (pi), indo por cima até embaixo.
    outer = [(c - r_out * math.cos(a), c - r_out * math.sin(a))
             for a in [a_out + (2 * math.pi - 2 * a_out) * k / steps for k in range(steps + 1)]]
    inner = [(c - r_in * math.cos(a), c - r_in * math.sin(a))
             for a in [a_in + (2 * math.pi - 2 * a_in) * k / steps for k in range(steps + 1)]]
    return outer + inner[::-1]


def ring_svg_path():
    c, r_out, r_in = VIEW / 2, RING_R, RING_R - RING_W
    h = RING_GAP * RING_R
    xo, xi = c - math.sqrt(r_out**2 - h**2), c - math.sqrt(r_in**2 - h**2)
    f = lambda v: f'{v:.2f}'.rstrip('0').rstrip('.')
    return (f'M{f(xo)} {f(c - h)}A{r_out} {r_out} 0 1 1 {f(xo)} {f(c + h)}'
            f'H{f(xi)}A{r_in} {r_in} 0 1 0 {f(xi)} {f(c - h)}Z')


def write_svg():
    x0, y0, x1, y1 = LETTERS_BOX
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    t = f'translate({VIEW / 2:g} {VIEW / 2:g}) scale({LETTER_SCALE:g}) translate({-cx:.4f} {-cy:.4f})'
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}">'
        f'<rect width="{VIEW}" height="{VIEW}" rx="{TILE_RADIUS}" fill="{BLACK}"/>'
        f'<path fill="{LIME}" d="{ring_svg_path()}"/>'
        f'<g fill="{WHITE}" transform="{t}">' + ''.join(f'<path d="{d}"/>' for d in LETTERS) + '</g>'
        '</svg>\n'
    )
    with open(os.path.join(STATIC, 'favicon.svg'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(svg)


def render(size, rounded=True, content=1.0):
    """Desenha o ícone em `size` px. `content` reduz anel e letras (área segura dos ícones maskable)."""
    ss = max(4, math.ceil(1024 / size))  # superamostragem: desenha maior e reduz com média por área
    big = size * ss
    k = big / VIEW
    # Coordenadas do desenho -> pixels, com redução opcional em torno do centro.
    to_px = lambda p: ((VIEW / 2 + (p[0] - VIEW / 2) * content) * k, (VIEW / 2 + (p[1] - VIEW / 2) * content) * k)

    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    if rounded:
        draw.rounded_rectangle((0, 0, big - 1, big - 1), radius=TILE_RADIUS * k, fill=BLACK)
    else:
        draw.rectangle((0, 0, big, big), fill=BLACK)
    draw.polygon([to_px(p) for p in ring_points()], fill=LIME)

    # Letras com regra even-odd (o miolo do "P" é um furo).
    move = letters_transform()
    mask = Image.new('L', (big, big), 0)
    for d in LETTERS:
        for sub in parse_path(d):
            layer = Image.new('L', (big, big), 0)
            ImageDraw.Draw(layer).polygon([to_px(move(p)) for p in sub], fill=255)
            mask = ImageChops.logical_xor(mask.convert('1'), layer.convert('1')).convert('L')
    img.paste(WHITE, (0, 0), mask)
    return img.reduce(ss)


def write_logo():
    """Logo iPlace Corporativo (sem o selo Apple) em quadrado branco, para os dados estruturados."""
    src = Image.open(LOGO_SRC).convert('RGBA').crop((41, 70, 961, 990))  # anel centrado, com margem
    canvas = Image.new('RGB', src.size, WHITE)
    canvas.paste(src, (0, 0), src)
    canvas.resize((512, 512), Image.Resampling.LANCZOS).save(
        os.path.join(BRAND, 'logo-iplace-corporativo.png'), optimize=True)


def main():
    write_svg()
    ico = [render(s) for s in (16, 32, 48)]
    ico[-1].save(os.path.join(STATIC, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:-1])
    # iOS aplica a máscara arredondada sozinho e não aceita transparência.
    render(180, rounded=False, content=0.9).convert('RGB').save(os.path.join(STATIC, 'apple-touch-icon.png'), optimize=True)
    render(192).save(os.path.join(BRAND, 'icon-192.png'), optimize=True)
    render(512).save(os.path.join(BRAND, 'icon-512.png'), optimize=True)
    # Android recorta em círculo/squircle: conteúdo dentro dos 80% centrais.
    render(512, rounded=False, content=0.78).convert('RGB').save(os.path.join(BRAND, 'icon-maskable.png'), optimize=True)
    write_logo()
    print('ok')


if __name__ == '__main__':
    main()
