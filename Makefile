REPO=github.com/sean9999/good-graph-frontend
SEMVER := $$(git tag --sort=-version:refname | head -n 1)

build: clean
	npm run build:all

build-docker:
	docker build -t good-graph-frontend .

run-docker:
	docker run -P good-graph-frontend

install:
	npm install

clean:
	rm -rf .parcel-cache
	rm -rf ./dist/*
