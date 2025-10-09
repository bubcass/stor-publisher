DOCBOOK_RNG_URL = https://docbook.org/xml/5.0/rng/docbook.rng
SCHXSLT_URL     = https://github.com/schxslt/schxslt/releases/download/v1.9.3/schxslt-1.9.3.zip

all: get-deps

get-deps:
	@[ -f docbook.rng ] || curl -L $(DOCBOOK_RNG_URL) -o docbook.rng
	@[ -d schxslt ] || (curl -L $(SCHXSLT_URL) -o schxslt.zip && unzip -q schxslt.zip -d schxslt && rm schxslt.zip)

validate:
	# 1) Structural validation
	jing -c docbook.rng ../out/article.docbook.xml
	# 2) Business rules
	xsltproc schxslt/1.9.3/compile.xsl docbook-oireachtas.sch > compiled.sch.xsl
	xsltproc compiled.sch.xsl ../out/article.docbook.xml