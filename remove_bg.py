from PIL import Image

def remove_white_background(img_path, out_path, tolerance=30):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        if item[0] >= 255 - tolerance and item[1] >= 255 - tolerance and item[2] >= 255 - tolerance:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(out_path, "PNG")

remove_white_background("logo.jpg", "logo.png", tolerance=30)
