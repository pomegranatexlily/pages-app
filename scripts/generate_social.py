#!/usr/bin/env python3
"""PAGES watercolor identity: reproducible, first-party social preview and PWA icons.
Produces soft lavender paper, hand-inked plum monogram, and accessible
high-contrast typography without third-party downloads or user data.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import random
import math

ROOT = Path(__file__).resolve().parent.parent
random.seed(121513)
RESAMPLE = Image.Resampling.LANCZOS
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()

def paper(width, height):
    im = Image.new("RGB", (width, height), "#faf6ff")
    px = im.load()
    for y in range(height):
        for x in range(width):
            edge = min(1.0, abs(x / max(1, width - 1) - .5) * 1.16 +
                       abs(y / max(1, height - 1) - .5) * .42)
            wave = math.sin(x / max(10, width) * 14.6 + y / max(10, height) * 11) * 2
            px[x,y] = (int(251-14*edge+wave), int(247-15*edge+wave), int(255-3*edge))
    return im.convert("RGBA")

def wash(im, width, height):
    mask = Image.new("L", (width, height), 0)
    d = ImageDraw.Draw(mask)
    random.seed(121513)
    for cluster in range(3):
        left = cluster != 1
        cx = (width * .06 if left else width*.96)
        if cluster == 2: cx=width*.14
        cy = height*(.12 if cluster == 0 else (.8 if cluster == 1 else .91))
        for i in range(17):
            rx = random.uniform(width*.035,width*.18)
            ry = random.uniform(height*.025,height*.14)
            x = cx + random.uniform(-width*.16,width*.13)
            y = cy + random.uniform(-height*.19,height*.16)
            d.ellipse((x-rx,y-ry,x+rx,y+ry),fill=random.randrange(35,110))
    blur=mask.filter(ImageFilter.GaussianBlur(max(4,int(width*.021))))
    violet=Image.new("RGBA",(width,height),(134,82,204,0))
    violet.putalpha(blur)
    im.alpha_composite(violet)
    detail=ImageDraw.Draw(im)
    for side in [0,1]:
        for i in range(5):
            x = width*(.03 if side == 0 else .94)
            y = height*(.12+i*.175)
            detail.arc((x-width*.07,y-height*.15,x+width*.14,y+height*.25),
                       20 if side == 0 else 135,140 if side == 0 else 255,
                       fill=(164,125,213,65),width=max(1,int(width*.003)))
    return im

def centered_text(draw, area, text, typeface, fill):
    left,top,right,bottom=area
    bounds=draw.textbbox((0,0),text,font=typeface)
    tw,th=bounds[2]-bounds[0],bounds[3]-bounds[1]
    draw.text((left+(right-left-tw)/2-bounds[0],
               top+(bottom-top-th)/2-bounds[1]),text,font=typeface,fill=fill)

def icon(size=512,maskable=False):
    # Supersample for crisp rounded-corner and small-screen icon edges.
    S=800
    im=paper(S,S)
    wash(im,S,S)
    d=ImageDraw.Draw(im)
    padding=160 if maskable else 86
    letter_font=font(BOLD, 520 if not maskable else 390)
    centered_text(d,(padding,padding,S-padding,S-padding),
                  "P",letter_font,(65,32,111,255))
    return im.convert("RGB").resize((size,size),RESAMPLE)

for size,name in [(32,"favicon-32.png"),(180,"apple-touch-icon.png"),
                  (192,"icon-192.png"),(512,"icon-512.png")]:
    icon(size).save(ROOT/name,optimize=True)
    print("Created",name)
icon(512,maskable=True).save(ROOT/"icon-maskable-512.png",optimize=True)
print("Created icon-maskable-512.png")

W,H=1200,630
cover=paper(W,H)
wash(cover,W,H)
d=ImageDraw.Draw(cover)
plum=(65,32,111,255)
purple=(106,67,149,255)
centered_text(d,(125,90,1075,230),"P",font(BOLD,155),plum)
centered_text(d,(110,255,1090,365),"P A G E S",font(SERIF,80),plum)
centered_text(d,(100,368,1100,432),"Organize. Create. Connect.",
              font(SANS,33),purple)
centered_text(d,(150,495,1050,535),"POMEGRANATE × LILY",
              font(SANS,21),purple)
cover.convert("RGB").save(ROOT/"social-preview.png",optimize=True)
print("Created social-preview.png")
