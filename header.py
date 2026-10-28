"""Extrai o cabeçalho do PDF (com a cor final de impressão e o título) para o site.

Uso:  python site\tools\header.py        (precisa do pacote pymupdf)
"""
import os
import fitz
from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(os.path.dirname(SITE), 'Catalogo_GranFish_A4_Paisagem_300dpi_CMYK.pdf')

doc = fitz.open(PDF)
page = doc[3]                                   # página de referência: imagem única 3508x2480
xref = page.get_images()[0][0]
pm = fitz.Pixmap(doc, xref)
if pm.colorspace.n != 3:
    pm = fitz.Pixmap(fitz.csRGB, pm)
tmp = os.path.join(SITE, 'img', '_p.png')
pm.save(tmp)
im = Image.open(tmp).convert('RGB')
hd = im.crop((0, 0, im.width, round(203 / 1521 * im.width)))
hd = hd.resize((2000, round(hd.height * 2000 / hd.width)), Image.LANCZOS)
hd.save(os.path.join(SITE, 'img', 'cabecalho.webp'), 'WEBP', quality=88, method=6)
os.remove(tmp)
print(hd.size, '#%02x%02x%02x' % hd.getpixel((10, 10)))
