from PIL import Image, ImageEnhance

# Open the image
img = Image.open('nextorapos.png')

# Convert to grayscale (black and white)
bw_img = img.convert('L')

# Improve contrast to make the text and UI elements pop more
contrast_enhancer = ImageEnhance.Contrast(bw_img)
bw_img = contrast_enhancer.enhance(1.2)

# Improve sharpness to increase the perceived quality
sharpness_enhancer = ImageEnhance.Sharpness(bw_img)
bw_img = sharpness_enhancer.enhance(2.0)

# Save the refined image
bw_img.save('nextorapos.png')
