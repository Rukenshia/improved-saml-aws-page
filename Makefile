all: dist/tailwind.css
.PHONY: all

dist/tailwind.css: style.css script.js
	npx tailwindcss -i ./style.css -o ./dist/tailwind.css --minify

bundle: dist/tailwind.css
	(cat script.js | tac | tail -n +2 | tac; echo "window.tailwind = \`"; cat dist/tailwind.css | sed 's#\\#\\\\#g'; echo "\`;\nmain();") > dist/improved_saml_page.user.js

run:
	echo script.js | entr make all
.PHONY: run
