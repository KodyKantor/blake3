TARGETS=nodejs browser web
MODE=dev

RUST_BLAKE3_WASM_SRC = $(wildcard rs/wasm/src/blake3/*.rs)
RUST_BLAKE3_WASM_OUT = $(patsubst %, dist/wasm/blake3/%/blake3_js_bg.wasm, $(TARGETS))
RUST_SHA2_WASM_SRC = $(wildcard rs/wasm/src/sha2/*.rs)
RUST_SHA2_WASM_OUT = $(patsubst %, dist/wasm/sha2/%/sha2_js_bg.wasm, $(TARGETS))
RUST_BLAKE3_NATIVE_SRC = $(wildcard rs/blake3/native/src/*.rs)
RUST_BLAKE3_NATIVE_OUT = dist/blake3/native.node
RUST_SHA2_NATIVE_SRC = $(wildcard rs/sha2/native/src/*.rs)
RUST_SHA2_NATIVE_OUT = dist/sha2/native.node
#TS_SRC = $(wildcard ts/*.ts)
TS_SRC = $(wildcard ts/node/*.ts) # So the `make` command does work more often when developing node code.
TS_OUT = dist/index.js esm/index.js

all: $(RUST_SHA2_WASM_OUT) $(RUST_BLAKE3_WASM_OUT) $(RUST_BLAKE3_NATIVE_OUT) $(RUST_SHA2_NATIVE_OUT) $(TS_OUT)
#all: $(RUST_SHA2_WASM_OUT) $(RUST_BLAKE3_WASM_OUT) $(RUST_BLAKE3_NATIVE_OUT) $(TS_OUT)

prepare:
	npm install

rust: $(RUST_BLAKE3_WASM_OUT) $(RUST_BLAKE3_NATIVE_OUT)

fmt: fmt-rs fmt-ts

fmt-rs: $(RUST_BLAKE3_NATIVE_SRC) $(RUST_BLAKE3_WASM_SRC)
	rustfmt $^

fmt-ts: $(TS_SRC)
	./node_modules/.bin/remark readme.md -f -o readme.md
	./node_modules/.bin/prettier --write "ts/**/*.ts" "*.md"

$(RUST_BLAKE3_NATIVE_OUT): $(RUST_BLAKE3_NATIVE_SRC)
ifeq ($(MODE), release)
	cd rs/blake3 && ../../node_modules/.bin/neon build --release
else
	cd rs/blake3 && ../../node_modules/.bin/neon build
endif
	mkdir -p $@
	mv rs/blake3/native/index.node $@

$(RUST_SHA2_NATIVE_OUT): $(RUST_SHA2_NATIVE_SRC)
ifeq ($(MODE), release)
	cd rs/sha2 && ../../node_modules/.bin/neon build --release
else
	cd rs/sha2 && ../../node_modules/.bin/neon build
endif
	mkdir -p $@
	mv rs/sha2/native/index.node $@

$(TS_OUT): $(TS_SRC) $(RUST_BLAKE3_WASM_OUT) $(RUST_SHA2_WASM_OUT)
	./node_modules/.bin/tsc
	./node_modules/.bin/tsc -p tsconfig.esm.json
	node dist/build/add-js-extensions
	node dist/build/generate-tasks

$(RUST_BLAKE3_WASM_OUT): $(RUST_BLAKE3_WASM_SRC)
	wasm-pack build rs/wasm/blake3 --$(MODE) -t $(word 4, $(subst /, ,$@)) -d ../../../$(dir $@)
ifeq ($(MODE), release)
	wasm-opt -O4 -o $@.min $@
	mv $@.min $@
endif

$(RUST_SHA2_WASM_OUT): $(RUST_SHA2_WASM_SRC)
	wasm-pack build rs/wasm/sha2 --$(MODE) -t $(word 4, $(subst /, ,$@)) -d ../../../$(dir $@)
ifeq ($(MODE), release)
	wasm-opt -O4 -o $@.min $@
	mv $@.min $@
endif

clean:
	rm -rf esm dist

prepare-binaries: $(TS_OUT)
	git checkout generate-binary
	git reset --hard origin/master
	node dist/build/generate-tasks
	git add . && git commit -m "generate build tasks" || echo "No update to build tasks"
	git push -u origin generate-binary -f
	git checkout -

.PHONY: all clean prepare fmt fmt-rs fmt-ts prepare-binaries
