build-BackendFunction:
	npm install --include=dev --no-fund --no-audit
	npm exec prisma generate
	npm run build
	npm prune --omit=dev
	mkdir -p $(ARTIFACTS_DIR)
	cp -R dist/* $(ARTIFACTS_DIR)
	cp -R node_modules $(ARTIFACTS_DIR)
	cp package.json $(ARTIFACTS_DIR)
	mkdir -p $(ARTIFACTS_DIR)/prisma
	cp prisma/schema.prisma $(ARTIFACTS_DIR)/prisma/schema.prisma
	cp -R prisma/migrations $(ARTIFACTS_DIR)/prisma/migrations
