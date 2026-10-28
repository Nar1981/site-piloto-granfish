"""Exporta as imagens otimizadas (WebP) e o data.json do site a partir da mesma fonte do PDF (build\build.py).

Uso:  build\venv\Scripts\python.exe site\tools\export.py   (barcos, grafismos e data.json)
      python site\tools\header.py                          (cabeçalho, extraído do PDF)
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
BUILD = os.path.join(os.path.dirname(SITE), 'build')
sys.path.insert(0, BUILD)

import build as B            # reutiliza as mesmas funções e dados do PDF
from PIL import Image

IMG = os.path.join(SITE, 'img')
for d in ('b', 't', 'g', 's'):   # b barco | t miniatura | g grafismo | s grafismo pequeno (índice)
    os.makedirs(os.path.join(IMG, d), exist_ok=True)

BOAT_W, THUMB_W, G_W, GS_W = 1400, 420, 960, 300


def save(im, path, w, q=80, alpha=False):
    s = w / im.width
    im = im.resize((w, max(1, round(im.height * s))), Image.LANCZOS)
    im.convert('RGBA' if alpha else 'RGB').save(path, 'WEBP', quality=q, method=6)


def hexof(rgb):
    return '#%02X%02X%02X' % tuple(rgb)


def main():
    items = B.build_items()
    out, counter = [], 2          # as 2 primeiras páginas do PDF são capa e índice
    for it in items:
        is_sem = it['key'].startswith('sem')
        boats = [B.apply_texture(v) for v in it['vs']]
        variants = []
        for i, ref in enumerate(it['refs']):
            slug = ref.lower()
            save(boats[i], os.path.join(IMG, 'b', slug + '.webp'), BOAT_W, 82)
            save(boats[i], os.path.join(IMG, 't', slug + '.webp'), THUMB_W, 78)
            save(it['vs'][i], os.path.join(IMG, 'g', slug + '.webp'), G_W, 85, alpha=True)
            save(it['vs'][i], os.path.join(IMG, 's', slug + '.webp'), GS_W, 80, alpha=True)
            pal = [{'hex': hexof(rgb), 'cmyk': list(B.to_cmyk_pct(rgb))} for rgb, _ in it['pal'][i]]
            variants.append({'ref': ref, 'slug': slug, 'name': it['names'][i], 'pal': pal})
        counter += 1 if is_sem else len(it['refs'])
        first_page = counter if is_sem else counter - len(it['refs']) + 1
        out.append({'key': it['key'], 'type': 'sem' if is_sem else 'ref', 'label': it['label'],
                    'line': it['name'], 'page': first_page, 'variants': variants})
        print(it['label'], flush=True)
    with open(os.path.join(SITE, 'data.json'), 'w', encoding='utf-8') as f:
        json.dump({'items': out}, f, ensure_ascii=False, separators=(',', ':'))

    print('ok', len(out), 'linhas')


if __name__ == '__main__':
    main()
