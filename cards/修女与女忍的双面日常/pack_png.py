#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把角色卡 JSON 嵌入封面 PNG（chara V2 + ccv3 V3 双 tEXt chunk，与 ST 的 write() 行为一致）。
用法：python3 pack_png.py <封面.png> <角色卡.json> <输出.png>
依据：~/STDB/A2_角色卡格式规范.md §5（src/character-card-parser.js，high）
"""
import base64
import json
import struct
import sys
import zlib

SIG = b"\x89PNG\r\n\x1a\n"


def read_chunks(data: bytes):
    assert data[:8] == SIG, "不是 PNG 文件"
    pos, chunks = 8, []
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos : pos + 4])
        ctype = data[pos + 4 : pos + 8]
        cdata = data[pos + 8 : pos + 8 + length]
        crc = data[pos + 8 + length : pos + 12 + length]
        chunks.append((ctype, cdata, crc))
        pos += 12 + length
    return chunks


def make_text_chunk(keyword: str, text: str) -> bytes:
    payload = keyword.encode("latin-1") + b"\x00" + text.encode("latin-1")
    return struct.pack(">I", len(payload)) + b"tEXt" + payload + struct.pack(">I", zlib.crc32(b"tEXt" + payload) & 0xFFFFFFFF)


def pack(png_path: str, json_path: str, out_path: str) -> None:
    card = json.load(open(json_path, encoding="utf-8"))
    v2_b64 = base64.b64encode(json.dumps(card, ensure_ascii=False).encode("utf-8")).decode("ascii")
    card_v3 = dict(card)
    if card.get("spec") == "chara_card_v2":
        card_v3["spec"], card_v3["spec_version"] = "chara_card_v3", "3.0"
        v3_b64 = base64.b64encode(json.dumps(card_v3, ensure_ascii=False).encode("utf-8")).decode("ascii")
    else:
        v3_b64 = None

    raw = open(png_path, "rb").read()
    chunks = read_chunks(raw)
    # ST 行为：先删掉旧的 chara/ccv3 chunk，再把新 chunk 插到 IEND 之前
    kept = [(t, d, c) for t, d, c in chunks if t != b"tEXt" or not (d.split(b"\x00", 1)[0].lower() in (b"chara", b"ccv3"))]
    out = bytearray(SIG)
    for ctype, cdata, crc in kept:
        if ctype == b"IEND":
            out += make_text_chunk("chara", v2_b64)
            if v3_b64:
                out += make_text_chunk("ccv3", v3_b64)
        out += struct.pack(">I", len(cdata)) + ctype + cdata + crc
    open(out_path, "wb").write(bytes(out))
    print(f"已打包: {out_path}（chara 必备，ccv3 {'已写' if v3_b64 else '跳过'}）")


def verify(png_path: str) -> None:
    chunks = read_chunks(open(png_path, "rb").read())
    found = {}
    for ctype, cdata, _ in chunks:
        if ctype == b"tEXt":
            key, _, val = cdata.partition(b"\x00")
            if key.lower() in (b"chara", b"ccv3"):
                card = json.loads(base64.b64decode(val).decode("utf-8"))
                found[key.decode()] = (card.get("spec"), card["data"]["name"])
    print("回读校验:", found)
    assert "chara" in found, "缺少 chara chunk"


if __name__ == "__main__":
    if len(sys.argv) == 2:
        verify(sys.argv[1])
    else:
        pack(sys.argv[1], sys.argv[2], sys.argv[3])
        verify(sys.argv[3])
