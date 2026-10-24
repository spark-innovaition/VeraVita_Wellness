import os
import re

TARGET_FILES = [
    'index.html',
    'about.html',
    'contact.html',
    'pricing.html',
    'thank-you.html',
    'practitioners.html',
    'faqs.html',
    'careers.html'
]

GTM_ID = 'GTM-WLXFFNWL'

GTM_HEAD = f"""<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','{GTM_ID}');</script>
<!-- End Google Tag Manager -->"""

GTM_BODY = f"""<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id={GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

def inject_gtm():
    for filename in TARGET_FILES:
        if not os.path.exists(filename):
            print(f"Skipping (file not found): {filename}")
            continue

        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        if GTM_ID in content:
            print(f"Already injected: {filename}")
            continue

        # Injects GTM_HEAD right after opening <head> (even if it has attributes)
        new_content = re.sub(
            r'(<head[^>]*>)',
            r'\1\n' + GTM_HEAD,
            content,
            count=1,
            flags=re.IGNORECASE
        )

        # Injects GTM_BODY right after opening <body> (even if it has classes/attributes)
        new_content = re.sub(
            r'(<body[^>]*>)',
            r'\1\n' + GTM_BODY,
            new_content,
            count=1,
            flags=re.IGNORECASE
        )

        if new_content != content:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully injected: {filename}")
        else:
            print(f"Warning: Could not match <head> or <body> in: {filename}")

if __name__ == '__main__':
    inject_gtm()