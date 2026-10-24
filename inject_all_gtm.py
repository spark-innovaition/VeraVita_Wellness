import os
import glob
import re

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

IGNORE_DIRS = {'not needed', 'notneeded', '.git', 'node_modules'}

updated_count = 0
already_present = 0

for file_path in glob.glob('**/*.html', recursive=True):
    parts = [p.lower() for p in os.path.normpath(file_path).split(os.sep)]
    if any(ignored in parts for ignored in IGNORE_DIRS):
        continue

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    if GTM_ID in content:
        already_present += 1
        continue

    new_content = re.sub(r'(<head[^>]*>)', r'\1\n' + GTM_HEAD, content, count=1, flags=re.IGNORECASE)
    new_content = re.sub(r'(<body[^>]*>)', r'\1\n' + GTM_BODY, new_content, count=1, flags=re.IGNORECASE)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected GTM into: {file_path}")
        updated_count += 1
    else:
        print(f"Warning: Could not match <head>/<body> in: {file_path}")

print(f"\nDone. Successfully updated {updated_count} active files. Skipped {already_present} files that already had GTM.")