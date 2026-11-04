"""Private extraction; no source attachments enter the student bundle."""
from pathlib import Path
import json
import re
import zipfile
import xml.etree.ElementTree as ET
import pymupdf as fitz

root = Path(__file__).resolve().parents[1]
out = root / '.local/incoming-nov04'
inventory = json.loads((out / 'inventory.json').read_text(encoding='utf8'))
for item in inventory:
    path = root / 'dispense' / item['file']
    if path.suffix == '.pdf' and item['textChars'] < item['pages'] * 600:
        folder = out / path.stem
        folder.mkdir(exist_ok=True)
        doc = fitz.open(path)
        for i, page in enumerate(doc):
            target = folder / f'{i+1:03}.png'
            if not target.exists():
                page.get_pixmap(matrix=fitz.Matrix(2400 / max(page.rect.width, page.rect.height), 2400 / max(page.rect.width, page.rect.height))).save(target)
        print(path.name, len(doc), 'rendered', flush=True)
    elif path.suffix in ['.ppt', '.pptx']:
        if path.suffix == '.ppt':
            path = out / (path.stem + '.pptx')
        with zipfile.ZipFile(path) as archive:
            names = sorted([n for n in archive.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)], key=lambda n: int(re.search(r'slide(\d+)', n)[1]))
            pages = []
            for i, name in enumerate(names):
                xml = ET.fromstring(archive.read(name))
                text = '\n'.join(n.text or '' for n in xml.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t'))
                pages.append({'page': i+1, 'text': text, 'pictures': len(list(xml.iter('{http://schemas.openxmlformats.org/presentationml/2006/main}pic')))})
            (out / (path.stem + '.json')).write_text(json.dumps(pages, ensure_ascii=False, indent=2), encoding='utf8')
            item['pages'] = len(pages)
            item['textChars'] = sum(len(p['text']) for p in pages)
            item['status'] = 'extracted-not-reviewed'
            print(path.name, len(pages), 'slides extracted', flush=True)
(out / 'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding='utf8')
