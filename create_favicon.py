from PIL import Image, ImageDraw, ImageFont
import os

# Create output directory if it doesn't exist
os.makedirs('static/img', exist_ok=True)

# Define a function to create an image of a given size
def create_favicon_image(size):
    # Create a square image with a blue gradient background
    img = Image.new('RGB', (size, size), color=(15, 23, 42))
    draw = ImageDraw.Draw(img)
    
    # Try to use a system font, or use default
    try:
        # Adjust font size based on image size
        font_size = int(size * 0.7)
        font = ImageFont.truetype("Arial Bold", font_size)
    except IOError:
        font = ImageFont.load_default()
    
    # Calculate position to center the text
    text = "S"
    text_width, text_height = draw.textbbox((0, 0), text, font=font)[2:4]
    position = ((size - text_width) // 2, (size - text_height) // 2 - int(size * 0.1))
    
    # Draw the letter "S" in white
    draw.text(position, text, fill=(59, 130, 246), font=font)
    
    return img

# Create favicon in various sizes (16, 32, 48, 64, 128)
favicon_sizes = [16, 32, 48, 64, 128]
favicon_images = []

for size in favicon_sizes:
    favicon_images.append(create_favicon_image(size))

# Save the main favicon.ico with multiple sizes
main_img = favicon_images[1]  # Use 32px as primary
main_img.save('static/img/favicon.ico', sizes=[(size, size) for size in favicon_sizes])

# Also save as PNG for modern browsers
favicon_images[4].save('static/img/favicon.png')  # Save 128px version as PNG

print("Favicon created successfully at static/img/favicon.ico and static/img/favicon.png") 