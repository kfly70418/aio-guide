"""Build outlined brand artwork and favicon exports. Requires fontTools and Pillow.

Run from the repository root on Windows, then run render_logo.mjs.
"""
from pathlib import Path
from html import escape
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[2]
NAVY = '#142440'
BLUE = '#2563EB'
MARK = '''<rect width="64" height="64" rx="18" fill="#2563EB"/>
<path d="M16.5 44 29 19a3.35 3.35 0 0 1 6 0l3.5 7" fill="none" stroke="#fff" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="m29 35 7 8 13-16" fill="none" stroke="#A5F3FC" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'''


def outline(text, font_file, x, top, height, fill, max_width=None):
    font = TTFont(font_file, fontNumber=0)
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    bounds = BoundsPen(glyphs)
    cursor = 0
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        glyph.draw(TransformPen(bounds, (1, 0, 0, 1, cursor, 0)))
        cursor += glyph.width
    left, bottom, right, upper = bounds.bounds
    scale = height / (upper - bottom)
    if max_width:
        scale = min(scale, max_width / (right - left))
    path = SVGPathPen(glyphs)
    cursor = 0
    for char in text:
        glyph = glyphs[cmap[ord(char)]]
        glyph.draw(TransformPen(path, (scale, 0, 0, -scale, x + (cursor-left)*scale, top + upper*scale)))
        cursor += glyph.width
    return f'<path fill="{fill}" d="{path.getCommands()}"/>', (right-left)*scale


def svg(title, description, content, width=204, height=56, viewbox=None):
    viewbox = viewbox or f'0 0 {width} {height}'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="{viewbox}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title>
<desc id="desc">{escape(description)}</desc>
{content}
</svg>
'''


api, api_width = outline('API', 'C:/Windows/Fonts/arialbd.ttf', 72, 13, 30, NAVY)
chinese, _ = outline('选', 'C:/Windows/Fonts/msyhbd.ttc', 72 + api_width + 9, 12, 32, BLUE)
zh = svg('API选', '蓝色圆角图标融合字母 A 与勾选符号，搭配 API选字标。',
         f'<g transform="scale(.875)">{MARK}</g>\n{api}\n{chinese}')
ru_word, ru_width = outline('Выбор', 'C:/Windows/Fonts/arialbd.ttf', 69, 16, 24, NAVY, 79)
ru_api, _ = outline('API', 'C:/Windows/Fonts/arialbd.ttf', 69+ru_width+7, 16, 24, BLUE, 47)
ru = svg('Выбор API', 'Синий знак объединяет букву A и галочку выбора.',
         f'<g transform="scale(.875)">{MARK}</g>\n{ru_word}\n{ru_api}')
mark = svg('API选', '字母 A 与勾选符号组成的 API选品牌图标。', MARK, 512, 512, '0 0 64 64')
for destination, content in [('public/logo.svg', zh), ('public/logo-ru.svg', ru),
                             ('public/logo-mark.svg', mark), ('app/icon.svg', mark)]:
    (ROOT / destination).write_text(content, encoding='utf-8')
print('Generated Chinese and Russian outlined logos and SVG icons.')
