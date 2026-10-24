import re

with open('gen_pages.py', 'r', encoding='utf-8') as f:
    content = f.read()

if 'GTM-WLXFFNWL' in content:
    print("GTM is already in gen_pages.py")
else:
    gtm_definitions = '''
GTM_HEAD = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WLXFFNWL');</script>
<!-- End Google Tag Manager -->"""

GTM_BODY = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WLXFFNWL"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""
'''
    # 1. Add variable definitions after the initial imports
    content = re.sub(r'^(import .*?\n\n|from .*?\n\n)', r'\1' + gtm_definitions + '\n', content, count=1, flags=re.DOTALL)
    
    # 2. Insert {GTM_HEAD} after <head> in the template string
    content = re.sub(r'(<head[^>]*>)', r'\1\n{GTM_HEAD}', content, count=1, flags=re.IGNORECASE)
    
    # 3. Insert {GTM_BODY} after <body in the template string
    content = re.sub(r'(<body[^>]*>)', r'\1\n{GTM_BODY}', content, count=1, flags=re.IGNORECASE)

    with open('gen_pages.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched gen_pages.py with GTM variables.")