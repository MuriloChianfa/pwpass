.PHONY: build-api build-cleanup build clean

GOFLAGS := -ldflags="-s -w" -tags lambda.norpc
GOARCH  := arm64
GOOS    := linux

OUT_DIR := dist

build: build-api build-cleanup

build-api:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(GOFLAGS) -o $(OUT_DIR)/api/bootstrap ./cmd/api
	cd $(OUT_DIR)/api && zip -j ../api.zip bootstrap

build-cleanup:
	GOOS=$(GOOS) GOARCH=$(GOARCH) go build $(GOFLAGS) -o $(OUT_DIR)/cleanup/bootstrap ./cmd/cleanup
	cd $(OUT_DIR)/cleanup && zip -j ../cleanup.zip bootstrap

clean:
	rm -rf $(OUT_DIR)
