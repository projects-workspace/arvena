'use strict';

window.ARVENA_DATA = Object.freeze({
    categories: [
        {
            slug: 'water',
            title: 'Water',
            description: 'Understand local water conditions and compare appropriate household treatment approaches.',
            solutionSlugs: ['clean-water-at-home']
        }
    ],
    solutions: [
        {
            slug: 'clean-water-at-home',
            title: 'Cleaner drinking water at home',
            category: 'water',
            problem: 'Choosing household water treatment without first defining the water-quality concern or checking product-specific claims.',
            reviewedAt: '21 August 2026',
            steps: [
                { title: 'Read or test', text: 'Use the current utility report or an appropriate accredited test to identify the substances or microorganisms of concern.' },
                { title: 'Match the method', text: 'Choose a treatment technology and certified reduction claim that directly addresses the defined concern.' },
                { title: 'Check the whole setup', text: 'Review capacity, replacement schedule, installation, materials, waste water where relevant, and local product availability.' },
                { title: 'Maintain and re-check', text: 'Follow the manufacturer’s maintenance instructions and revisit the choice when water conditions or guidance changes.' }
            ],
            technologies: [
                { name: 'Activated carbon', level: 'Simple', usefulFor: 'Taste, odour, chlorine, and only the additional contaminants specifically covered by a certified product claim.', limitation: 'Carbon is not a universal germ or dissolved-contaminant treatment. Media must be replaced on schedule.' },
                { name: 'Certified multi-stage filtration', level: 'Balanced', usefulFor: 'Combining particulate or cyst reduction with activated carbon where the exact product is certified for the required claims.', limitation: 'NSF/ANSI standard numbers describe testing frameworks; the product label and performance sheet define what the model actually reduces.' },
                { name: 'Reverse osmosis', level: 'Advanced', usefulFor: 'Some dissolved chemicals, salts, and microorganisms when the specific system is tested for the target concern.', limitation: 'Higher maintenance, installation requirements, reject water, and product-specific performance must be considered.' }
            ],
            productSlugs: ['certified-point-of-use-filter']
        }
    ],
    products: [
        {
            slug: 'certified-point-of-use-filter',
            title: 'Certified point-of-use water filter',
            category: 'water',
            description: 'A household drinking-water filter selected by the contaminants it is independently certified to reduce—not by a generic “purification” promise.',
            problem: 'A defined drinking-water concern at one kitchen tap',
            whySelected: 'A point-of-use system keeps the decision focused on drinking and cooking water. Certification and a performance data sheet make specific reduction claims inspectable, while a local water report keeps the choice tied to an actual need.',
            materials: 'Product-specific filter media and housing; verify all wetted materials and replacement cartridges',
            priceLevel: 'Not yet verified for a specific market',
            status: 'Researching verified models',
            availability: 'Request-based matching for Czechia and other European markets',
            reviewedAt: '21 August 2026',
            evidence: [
                { type: 'Public-health guidance', confidence: 'Established guidance', explanation: 'Filter choice should start with water-quality information, and the label should identify the substances a specific filter is designed to remove.', sourceTitle: 'CDC — About Choosing Home Water Filters', sourceUrl: 'https://www.cdc.gov/drinking-water/prevention/about-choosing-home-water-filters.html' },
                { type: 'Technical standard', confidence: 'Product-specific certification', explanation: 'NSF/ANSI 42 addresses aesthetic effects; NSF/ANSI 53 addresses specified health-related reduction claims. Claims vary by product.', sourceTitle: 'NSF — Filtration Systems Standards 42, 53 and 401', sourceUrl: 'https://www.nsf.org/gb/en/knowledge-library/nsf-ansi-42-53-and-401-filtration-systems-standards' },
                { type: 'Arvena reviewed', confidence: 'Editorial scope check', explanation: 'The profile states a selection method and limitations, but does not recommend a seller or model until its claims and availability are reviewed.', sourceTitle: 'Arvena methodology', sourceUrl: '#/methodology' }
            ],
            limitations: [
                'This profile describes a product type, not proof that every filter with similar media removes the same contaminants.',
                'An NSF/ANSI standard number is not enough by itself; verify the exact reduction claims for the exact model.',
                'Most pitcher and refrigerator carbon filters are primarily intended to improve taste and odour rather than remove microorganisms.',
                'Incorrect installation or overdue cartridge replacement can reduce performance and allow microbial growth.',
                'Local advisories, private-well risks, and immunocompromised users may require qualified, situation-specific guidance.'
            ],
            relatedGuideSlugs: ['clean-water-at-home']
        }
    ]
});
