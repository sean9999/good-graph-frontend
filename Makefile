REPO=github.com/sean9999/good-graph-frontend
SEMVER := $$(git tag --sort=-version:refname | head -n 1)

build: clean
	npm run build:all

install:
	npm install

clean:
	rm -rf .parcel-cache
	rm -rf ./dist/*
