"""Gera o favicon e os ícones do site a partir do logo iPlace.

Uso:  python scripts/favicons.py
Desenho: só o anel verde iPlace (aberto à esquerda, como no logo), sem letras,
sobre fundo preto. O SVG e os PNG/ICO saem da mesma geometria.
Escreve em src/static/ (raiz do site) e em src/assets/img/brand/.
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC = os.path.join(ROOT, 'src', 'static')
BRAND = os.path.join(ROOT, 'src', 'assets', 'img', 'brand')
LOGO_SRC = os.path.join(ROOT, 'assets-src', 'wp-uploads', 'iplace-corp-premium-copiar.png')

BLACK, WHITE, LIME = '#000000', '#FFFFFF', '#C8D400'
VIEW = 512           # viewBox do desenho
TILE_RADIUS = 112    # cantos do quadrado nos ícones com fundo transparente
RING_R, RING_W = 216, 36  # raio externo e espessura do anel
RING_GAP = 0.37      # meia-altura da abertura, em fração do raio (proporção do logo)


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
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {VIEW} {VIEW}">'
        f'<rect width="{VIEW}" height="{VIEW}" rx="{TILE_RADIUS}" fill="{BLACK}"/>'
        f'<path fill="{LIME}" d="{ring_svg_path()}"/>'
        '</svg>\n'
    )
    with open(os.path.join(STATIC, 'favicon.svg'), 'w', encoding='utf-8', newline='\n') as fh:
        fh.write(svg)


def render(size, rounded=True, content=1.0):
    """Desenha o ícone em `size` px. `content` reduz o anel (área segura dos ícones maskable)."""
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
