<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
                xmlns:exsl="http://exslt.org/common"
                xmlns:x="http://www.tei-c.org/ns/1.0"
                xmlns:tst="https://github.com/tst-project"
                exclude-result-prefixes="x tst exsl">

<xsl:import href="./lib/xslt/edition.xsl"/>

<xsl:output method="html" encoding="UTF-8" omit-xml-declaration="yes" indent="no"/>

<xsl:param name="root">./lib/</xsl:param>
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
            <xsl:attribute name="href"><xsl:value-of select="$root"/>css/wordindex.css</xsl:attribute>
        </xsl:element>
        <xsl:element name="link">
            <xsl:attribute name="rel">stylesheet</xsl:attribute>
            <xsl:attribute name="href">./lexicon.css</xsl:attribute>
        </xsl:element>
        <!--xsl:element name="script">
            <xsl:attribute name="type">module</xsl:attribute>
            <xsl:attribute name="src"><xsl:value-of select="$root"/>js/edition.mjs</xsl:attribute>
            <xsl:attribute name="id">editionscript</xsl:attribute>
        </xsl:element-->
        <xsl:element name="script">
            <xsl:attribute name="type">module</xsl:attribute>
            <xsl:attribute name="src">./lexicon.mjs</xsl:attribute>
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
                            <xsl:attribute name="class">record thin</xsl:attribute>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:attribute name="class">record fat</xsl:attribute>
                        </xsl:otherwise>
                    </xsl:choose>
                    <xsl:element name="div">
                        <xsl:attribute name="id">topbar</xsl:attribute>
                        <div id="buttoncontainer">
                            <xsl:element name="div">
                                <xsl:attribute name="id">transbutton</xsl:attribute>
                                <xsl:attribute name="data-anno">change script</xsl:attribute>
                                <xsl:text>A</xsl:text>
                            </xsl:element>
                        </div>
                    </xsl:element>
                    <xsl:element name="article">
                        <xsl:apply-templates/>
                        <h4>Revision history</h4>
                        <p style="font-size: 1.2rem">
                            <xsl:text>Edited by </xsl:text>
                            <xsl:value-of select="//x:titleStmt/x:editor"/>
                            <xsl:text>. </xsl:text>
                            <span id="latestcommit"></span>
                        </p>
                        <p><a href="https://doi.org/10.5281/zenodo.15680522"><img src="https://zenodo.org/badge/785581051.svg" alt="DOI"/></a></p>
                        <p style="font-size: 1.2rem" class="bibliography" id="suggested-citation">
                            <xsl:value-of select="//x:titleStmt/x:editor/x:surname"/>
                            <xsl:text>, </xsl:text>
                            <xsl:value-of select="//x:titleStmt/x:editor/x:forename"/>
                            <xsl:text>. 2025. </xsl:text>
                            <q>
                                <xsl:value-of select="//x:titleStmt/x:title"/>
                                <xsl:text>.</xsl:text>
                            </q>
                            <em>
                                <xsl:text> Tamilex. </xsl:text>
                            </em>
                            <a id="citationlink"></a>
                            <xsl:text> doi:10.5281/zenodo.15680522</xsl:text>
                        </p>
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
    <details open="true">
        <summary style="font-size: 1.5rem; font-style: italic">Meanings attested in the <em lang="ta">Nikaṇṭu</em>-s</summary>
        <ul id="nikantu-list" lang="ta">
            <xsl:apply-templates select="x:cit[@type='nikantu-meanings']/x:sense"/>
        </ul>
    </details>
    <details open="true">
        <summary style="font-size: 1.5rem; font-style: italic">Other lexica</summary>
        <ul>
            <xsl:apply-templates select="x:cit[@type='lexicon']"/>
        </ul>
    </details>
    <details>
        <xsl:attribute name="id"><xsl:value-of select="@corresp"/></xsl:attribute>
        <summary style="font-size: 1.5rem; font-style: italic">Tamilex citations</summary>
        <details class="dict" style="margin-top: 1rem">
            <xsl:attribute name="data-lemma"><xsl:value-of select="@corresp"/></xsl:attribute>
            <xsl:attribute name="data-entry"><xsl:value-of select="x:form"/></xsl:attribute>
            <summary class="dict-heading" lang="ta"><xsl:value-of select="x:form"/></summary>
            <div class="spinner"></div>
        </details>
        <xsl:apply-templates select="x:entry"/>
    </details>
    <xsl:if test="x:cit[@type='nikantu']">
        <details>
            <summary style="font-size: 1.5rem; font-style: italic"><em lang="ta">Nikaṇṭu</em> citations</summary>
            <ul>
                <xsl:apply-templates select="x:cit[@type='nikantu']"/>
            </ul>
        </details>
    </xsl:if>
    <xsl:if test="x:cit[@type='commentary']">
        <details>
            <summary style="font-size: 1.5rem; font-style: italic">Commentarial glosses</summary>
            <ul>
                <xsl:apply-templates select="x:cit[@type='commentary']"/>
            </ul>
        </details>
    </xsl:if>
    <xsl:if test="x:cit[@type='external']">
        <details>
            <summary style="font-size: 1.5rem; font-style: italic">Other sources</summary>
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
<xsl:template match="x:sense/x:gramGrp">
    <xsl:call-template name="nested-grammar"/>
</xsl:template>
<xsl:template name="nested-grammar">
    <span class="nested-grammar" lang="en">
        <xsl:for-each select=".//x:gram">
            <xsl:apply-templates/>
            <xsl:if test="position() != last()">, </xsl:if>
        </xsl:for-each>
        <xsl:text>.</xsl:text>
    </span>
    <xsl:text> </xsl:text>
</xsl:template>

<xsl:template match="x:form[@type='variant']">
    <span class="form-variant">
        <xsl:text>(var. </xsl:text>
        <em lang="ta"><xsl:apply-templates/></em>
        <xsl:text>)</xsl:text>
    </span>
        <xsl:text> </xsl:text>
</xsl:template>
<xsl:template match="x:sense">
    <li>
        <div class="sense">
            <div>
            <xsl:if test="@cert='low'">
                <xsl:attribute name="class">certlow</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates select="x:gramGrp"/>
            <xsl:apply-templates select="x:form[@type='variant']"/>
            <xsl:apply-templates select="x:def"/>
            <xsl:if test="x:cit">
                <ul>
                    <xsl:apply-templates select="x:cit"/>
                </ul>
            </xsl:if>
            </div>
            <div>
            <xsl:apply-templates select="x:note"/>
            </div>
        </div>
    </li>
</xsl:template>
<xsl:template match="x:sense/x:note">
    <small class="note"><xsl:apply-templates/></small>
</xsl:template>
<xsl:template match="x:def">
    <span>
        <xsl:if test="@xml:lang='ta'">
            <xsl:attribute name="class">def-ta</xsl:attribute>
        </xsl:if>
        <xsl:call-template name="lang"/>
        <xsl:apply-templates/>
    </span>
</xsl:template>
<xsl:template match="x:cit">
    <li>
        <xsl:if test="@xml:id">
            <xsl:attribute name="id"><xsl:value-of select="@xml:id"/></xsl:attribute>
        </xsl:if>
        <xsl:if test="@source">
            <xsl:attribute name="data-source">
                <xsl:value-of select="@source"/>
            </xsl:attribute>
        </xsl:if>
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
<xsl:template match="x:cit[@type='nikantu-meanings']/x:sense">
    <li><div class="citation-nikantu">
        <xsl:call-template name="lang"/>
        <span class="nikantu-form"><xsl:apply-templates select="x:form/node()"/></span>
        <ul>
        <xsl:for-each select="x:cit">
            <li>
                <span class="citref">
                    <span class="msid"><xsl:apply-templates select="x:ref/x:title"/></span>
                    <xsl:text> </xsl:text>
                    <span class="versenumber" lang="en"><xsl:apply-templates select="x:ref/x:num"/></span>
                    <span class="verseid"><xsl:value-of select="x:ref/@target"/></span>
                </span>
                <xsl:text> </xsl:text>
                <span class="nikantu-meanings">
                    <xsl:for-each select="x:def">
                        <span>
                            <xsl:if test="@n">
                                <xsl:attribute name="data-quantity">
                                    <xsl:value-of select="@n"/>
                                </xsl:attribute>
                            </xsl:if>
                            <xsl:apply-templates />
                        </span>
                        <xsl:if test="position() != last()">
                            <xsl:text>, </xsl:text>
                        </xsl:if>
                    </xsl:for-each>
                </span>
            </li>
        </xsl:for-each>
        </ul>
    </div></li>
</xsl:template>

<xsl:template match="x:cit[@type='lexicon']">
    <li>
        <span class="date"><xsl:apply-templates select="x:bibl/x:date"/></span>
        <xsl:text> </xsl:text>
        <span class="msid">
            <xsl:apply-templates select="x:bibl/x:title"/>
            <xsl:if test="x:bibl/x:edition">
                <xsl:text> </xsl:text>
                <span class="edition">
                    <xsl:value-of select="x:bibl/x:edition"/>
                </span>
            </xsl:if>
        </span>
        <xsl:apply-templates select="x:bibl/x:note"/>
        <xsl:text> </xsl:text>
        <xsl:for-each select="x:bibl/x:ref">
            <xsl:apply-templates select="."/>
            <xsl:if test="position() != last()">, </xsl:if>
        </xsl:for-each>
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
<xsl:template match="x:w">
    <span class="word split">
        <xsl:apply-templates/>
    </span>
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
        <xsl:attribute name="data-lemma"><xsl:value-of select="@corresp"/></xsl:attribute>
        <summary class="dict-heading" lang="ta">
            <xsl:value-of select="x:form"/>
            <xsl:if test="x:gramGrp">
                <xsl:text> </xsl:text>
                <xsl:call-template name="nested-grammar"/>
            </xsl:if>
        </summary>
        <div class="spinner"></div>
    </details>
</xsl:template>

<xsl:template match="x:listBibl">
    <details open="true">
        <summary style="font-size: 1.5rem; font-style: italic">Additional bibliography</summary>
        <xsl:apply-templates/>
    </details>
</xsl:template>
</xsl:stylesheet>
