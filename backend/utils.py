import re

def clean_text(text):

    # Preserve line breaks
    text = re.sub(r'[ \t]+', ' ', text)

    # Remove extra blank lines
    text = re.sub(r'\n+', '\n', text)

    return text.strip()