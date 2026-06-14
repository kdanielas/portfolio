import os
import random
import base64
import zlib
import struct

def make_noise_png(width, height):
    # Create raw image data: RGBA
    raw_data = bytearray()
    for y in range(height):
        # filter byte for scanline (0 = None)
        raw_data.append(0)
        for x in range(width):
            val = random.randint(0, 255)
            # Black and white noise: R=val, G=val, B=val, A=255
            raw_data.extend([val, val, val, 255])
            
    # Compress the raw data
    idat_data = zlib.compress(raw_data)
    
    # PNG signature
    png = bytearray([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    
    def add_chunk(type_str, data):
        png.extend(struct.pack('>I', len(data)))
        png.extend(type_str.encode('ascii'))
        png.extend(data)
        crc = zlib.crc32(type_str.encode('ascii') + data) & 0xffffffff
        png.extend(struct.pack('>I', crc))
        
    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    add_chunk('IHDR', ihdr)
    
    # IDAT
    add_chunk('IDAT', idat_data)
    
    # IEND
    add_chunk('IEND', b'')
    
    return png

png_data = make_noise_png(128, 128)
with open("css/noise.png", "wb") as f:
    f.write(png_data)

print("Generated css/noise.png successfully.")
