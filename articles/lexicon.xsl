<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst exsl">

<xsl:import href="../lib/xslt/edition.xsl"/>

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes" indent="no"/>

<xsl:param name="root">../../lib/</xsl:param>
<xsl:param name="debugging">false</xsl:param>

<xsl:template name="htmlheader">
    <xsl:element name="head">
        <xsl:element name="meta">
            <xsl:attribute name="charset">utf-8</xsl:attribute>
        </xsl:element>
        <xsl:element name="meta">
            <xsl:attribute name="name">viewport</xsl:attribute>
            <xsl:attribute name="content">width=device-width,initial-scale=1</xsl:attribute>
        </xsl:element>
        <xsl:element name="title">
            <xsl:value-of select="//x:titleStmt/x:title"/>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/tufte.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/fonts.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/tst.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/header.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/transcription.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/apparatus.css</xsl:attribute>
        </xsl:element>
        <xsl:if test="$debugging = 'true'">
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>debugging/prism.css</xsl:attribute>
            </xsl:element>
            <xsl:element name="link">
                <xsl:attribute name="rel">stylesheet</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="$root"/>debugging/codemirror.css</xsl:attribute>
            </xsl:element>
        </xsl:if>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/edition.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href">css/wordindex.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href">../lexicon.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="script">
            <xsl:attribute name="type">module</xsl:attribute>
            <xsl:attribute name="src"><xsl:value-of select="$root"/>js/edition.mjs</xsl:attribute>
            <xsl:attribute name="id">editionscript</xsl:attribute>
            <xsl:if test="$debugging = 'true'">
                <xsl:attribute name="data-debugging">true</xsl:attribute>
            </xsl:if>
        </xsl:element>
        <xsl:element name="script">
            <xsl:attribute name="type">module</xsl:attribute>
            <xsl:attribute name="src">../lexicon.mjs</xsl:attribute>
        </xsl:element>
    </xsl:element>
</xsl:template>
<xsl:template name="TEI">
    <xsl:element name="html">
        <xsl:call-template name="htmlheader"/>
        <xsl:element name="body">
            <xsl:attribute name="lang">en</xsl:attribute>   
            <xsl:element name="div">
                <xsl:attribute name="id">recordcontainer</xsl:attribute>
                <xsl:element name="div">
                    <xsl:choose>
                        <xsl:when test="x:facsimile/x:graphic">
                            <xsl:attribute name="id">record-thin</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="id">record-fat</xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                    <xsl:element name="div">
                        <xsl:attribute name="id">topbar</xsl:attribute>
                        <xsl:element name="div">
                            <xsl:attribute name="id">transbutton</xsl:attribute>
                            <xsl:attribute name="data-anno">change script</xsl:attribute>
                            <xsl:text>A</xsl:text>
                        </xsl:element>
                    </xsl:element>
                    <xsl:element name="article">
                        <xsl:apply-templates/>
                    </xsl:element>
                </xsl:element>
            </xsl:element>
        </xsl:element>
    </xsl:element>
</xsl:template>

<xsl:template match="x:teiHeader">
    <xsl:element name="section">
        <xsl:call-template name="lang"/>
        <xsl:apply-templates />
    </xsl:element>
    <xsl:variable name="teitext" select="/x:TEI/x:text"/>
</xsl:template>

<xsl:template match="x:text">
    <xsl:element name="section">
        <xsl:attribute name="class">
            <xsl:text>teitext</xsl:text>
        </xsl:attribute>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </xsl:element>
</xsl:template>
<xsl:template match="x:titleStmt"/>
<!--xsl:template match="x:revisionDesc">
    <section>
        <h3>Revision history</h3>
        <p id="latestcommit"></p>
        <xsl:element name="table">
            <xsl:apply-templates/>
        </xsl:element>
    </section>
</xsl:template-->
<xsl:template match="x:revisionDesc"/>
<xsl:template match="x:sourceDesc"/>

<xsl:template match="x:entry">
    <xsl:apply-templates select="x:form"/>
    <xsl:apply-templates select="x:gramGrp"/>
    <ol>
        <xsl:apply-templates select="x:sense[not(@type)]"/>
    </ol>
    <h5>Meanings attested in the <em lang="ta">Nikaṇṭu</em>-s</h5>
    <ul>
        <xsl:apply-templates select="x:sense[@type='nikantu']"/>
    </ul>
    <h5>Other lexica</h5>
    <ul>
        <xsl:apply-templates select="x:cit[@type='lexicon']"/>
    </ul>
    <details>
        <summary style="font-size: 1.2rem; font-weight: bold">Tamilex citations</summary>
        <details style="margin-left: 1rem" class="dict">
            <xsl:attribute name="id"><xsl:value-of select="@corresp"/></xsl:attribute>
            <xsl:attribute name="data-entry"><xsl:value-of select="x:form"/></xsl:attribute>
            <summary class="dict-heading"><xsl:value-of select="x:form"/></summary>
            <div class="spinner"></div>
        </details>
        <xsl:apply-templates select="x:entry"/>
    </details>
    <xsl:if test="x:cit[@type='commentary']">
        <details>
            <summary style="font-size: 1.2rem; font-weight: bold">Commentarial glosses</summary>
            <ul>
                <xsl:apply-templates select="x:cit[@type='commentary']"/>
            </ul>
        </details>
    </xsl:if>
    <xsl:if test="x:cit[@type='nikantu']">
        <details>
            <summary style="font-size: 1.2rem; font-weight: bold"><em lang="ta">Nikaṇṭu</em> attestations</summary>
            <ul>
                <xsl:apply-templates select="x:cit[@type='nikantu']"/>
            </ul>
        </details>
    </xsl:if>
    <xsl:if test="x:cit[@type='external']">
        <details>
            <summary style="font-size: 1.2rem; font-weight: bold">Other sources</summary>
                <ul>
                    <xsl:apply-templates select="x:cit[@type='external']"/>
                </ul>
        </details>
    </xsl:if>
</xsl:template>
<xsl:template match="x:form">
    <h3>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </h3>
</xsl:template>
<xsl:template match="x:gramGrp">
    <p>
        <xsl:for-each select="x:gram">
            <xsl:apply-templates/>
            <xsl:if test="position() != last()">, </xsl:if>
        </xsl:for-each>
    </p>
</xsl:template>
<xsl:template match="x:sense">
    <li>
        <xsl:apply-templates select="x:def"/>
        <xsl:apply-templates select="x:note"/>
        <xsl:if test="x:cit">
            <ul>
                <xsl:apply-templates select="x:cit"/>
            </ul>
        </xsl:if>
    </li>
</xsl:template>
<xsl:template match="x:sense/x:note">
    <small><xsl:apply-templates/></small>
</xsl:template>
<xsl:template match="x:def">
    <div>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </div>
</xsl:template>
<xsl:template match="x:cit">
    <li>
        <xsl:apply-templates select="x:q[@xml:lang='ta']"/>
        <xsl:text> </xsl:text>
        <xsl:choose>
            <xsl:when test="x:q[@rend='block']">
                <div class="blockcite">
                    <span class="msid">
                        <xsl:apply-templates select="x:ref"/>
                    </span>
                </div>
            </xsl:when>
            <xsl:otherwise>
                <span class="msid">
                    <xsl:apply-templates select="x:ref"/>
                </span>
            </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="x:q[@xml:lang='en']">
            <div>
                <xsl:apply-templates select="x:q[@xml:lang='en']"/>
            </div>
        </xsl:if>
    </li>
</xsl:template>
<xsl:template match="x:title">
    <em>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </em>
</xsl:template>
<xsl:template match="x:sense[@type='nikantu']">
    <li>
        <span class="msid"><xsl:apply-templates select="x:title"/></span>
        <xsl:text> </xsl:text>
        <span lang="ta">
            <xsl:for-each select="x:def">
                <xsl:apply-templates />
                <xsl:if test="position() != last()">
                    <xsl:text>, </xsl:text>
                </xsl:if>
            </xsl:for-each>
        </span>
    </li>
</xsl:template>
<xsl:template match="x:cit[@type='lexicon']">
    <li>
        <span class="msid"><xsl:apply-templates select="x:title"/></span>
        <xsl:text> </xsl:text>
        <xsl:apply-templates select="x:ref"/>
        <xsl:if test="x:q">
            <div>
                <xsl:apply-templates select="x:q"/>
            </div>
        </xsl:if>
    </li>
</xsl:template>
<xsl:template match="x:q">
    <q>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </q>
</xsl:template>
<xsl:template match="x:q[@rend='block']">
    <blockquote>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </blockquote>
</xsl:template>
<xsl:template match="x:entry/x:entry">
    <details style="margin-left: 1rem" class="dict">
        <xsl:attribute name="data-entry"><xsl:value-of select="x:form"/></xsl:attribute>
        <summary class="dict-heading"><xsl:value-of select="x:form"/></summary>
        <div class="spinner"></div>
    </details>
</xsl:template>
</xsl:stylesheet>
