package com.breyhanaariel.glossedtip.domain.model

object SampleData {
    val services = listOf(
        NailService("gelx", "Gel-X Full Set", "Lightweight extensions with a seamless gel finish.", 7000, 105),
        NailService("acrylic", "Acrylic Full Set", "Classic sculpted enhancement with custom shaping.", 8000, 120),
        NailService("fill", "Acrylic Fill", "Maintenance for an existing Glossed Tip acrylic set.", 5500, 90),
        NailService("structured", "Structured Manicure", "Builder gel overlay for strength on natural nails.", 6000, 90),
        NailService("manicure", "Signature Manicure", "Shape, cuticle care, polish, and finishing treatment.", 4000, 60),
        NailService("removal", "Safe Removal", "Professional product removal with nail care.", 2500, 35),
    )

    val portfolio = listOf(
        PortfolioSet("chrome-french", "Icy Chrome French", "gelx", "Almond", "Long", ArtLevel.DETAILED, 9500, listOf("French", "Chrome", "Long")),
        PortfolioSet("berry-aura", "Berry Aura", "structured", "Oval", "Short", ArtLevel.DETAILED, 7800, listOf("Freestyle", "Short")),
        PortfolioSet("gemmed", "Gemmed Gloss", "acrylic", "Coffin", "XL", ArtLevel.FREESTYLE, 12500, listOf("3D", "Freestyle", "Long")),
    )
}
