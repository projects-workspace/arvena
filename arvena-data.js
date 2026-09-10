'use strict';

(function () {
    function deepFreeze(value) {
        if (!value || (typeof value !== 'object' && typeof value !== 'function') || Object.isFrozen(value)) {
            return value;
        }

        Object.values(value).forEach((nestedValue) => deepFreeze(nestedValue));
        return Object.freeze(value);
    }

    const publicContent = {
        meta: {
            language: 'en',
            contentUpdatedAt: '4 September 2026',
            inventoryStatement: 'Clean Water is the only currently published solution area. The published records explain a need and a solution class. No specific offer or provider is currently published.'
        },
        domains: [
            {
                slug: 'water',
                title: 'Water',
                status: 'published',
                description: 'Understand local water conditions and compare appropriate household treatment approaches.',
                discoveryRecordSlugs: ['clean-water-at-home', 'point-of-use-filtration']
            },
            {
                slug: 'air-and-indoor-environment',
                title: 'Air and Indoor Environment',
                status: 'developing',
                description: 'Approaches to indoor air quality, ventilation and healthier interior conditions are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'food-kitchen-and-preservation',
                title: 'Food, Kitchen and Preservation',
                status: 'developing',
                description: 'Approaches to food preparation, kitchen use and preservation are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'household-materials',
                title: 'Household Materials',
                status: 'developing',
                description: 'Guidance on materials used in everyday household settings is being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'cleaning-and-household-products',
                title: 'Cleaning and Household Products',
                status: 'developing',
                description: 'Approaches to cleaning and practical household products are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'personal-everyday-products',
                title: 'Personal Everyday Products',
                status: 'developing',
                description: 'Guidance on products used in personal daily routines is being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'energy-and-resource-efficiency',
                title: 'Energy and Resource Efficiency',
                status: 'developing',
                description: 'Approaches to using energy and household resources more thoughtfully are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'environmental-monitoring',
                title: 'Environmental Monitoring',
                status: 'developing',
                description: 'Methods and tools for understanding environmental conditions are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'gardens-soil-and-growing',
                title: 'Gardens, Soil and Growing',
                status: 'developing',
                description: 'Approaches to gardens, soil care and growing are being developed.',
                discoveryRecordSlugs: []
            },
            {
                slug: 'homes-buildings-and-land-systems',
                title: 'Homes, Buildings and Land Systems',
                status: 'developing',
                description: 'Approaches that connect homes, buildings, land and supporting systems are being developed.',
                discoveryRecordSlugs: []
            }
        ],
        discoveryRecords: [
            {
                recordType: 'guide',
                slug: 'clean-water-at-home',
                title: 'Cleaner drinking water at home',
                domainSlug: 'water',
                publicationStatus: 'published',
                problem: 'Choosing household water treatment without first defining the water-quality concern or checking product-specific claims.',
                updatedAt: '4 September 2026',
                steps: [
                    { title: 'Read or test', text: 'Use the current utility report or an appropriate accredited test to identify the substances or microorganisms of concern.' },
                    { title: 'Match the method', text: 'Choose a treatment technology and certified reduction claim that directly addresses the defined concern.' },
                    { title: 'Check the whole setup', text: 'Review capacity, replacement schedule, installation, materials, waste water where relevant, and local product availability.' },
                    { title: 'Maintain and re-check', text: 'Follow the manufacturer’s maintenance instructions and revisit the choice when water conditions or guidance changes.' }
                ],
                approaches: [
                    { name: 'Activated carbon', level: 'Simple', usefulFor: 'Taste, odour, chlorine, and only the additional contaminants specifically covered by a certified product claim.', limitation: 'Carbon is not a universal germ or dissolved-contaminant treatment. Media must be replaced on schedule.' },
                    { name: 'Certified multi-stage filtration', level: 'Balanced', usefulFor: 'Combining particulate or cyst reduction with activated carbon where the exact product is certified for the required claims.', limitation: 'NSF/ANSI standard numbers describe testing frameworks; the product label and performance sheet define what the model actually reduces.' },
                    { name: 'Reverse osmosis', level: 'Advanced', usefulFor: 'Some dissolved chemicals, salts, and microorganisms when the specific system is tested for the target concern.', limitation: 'Higher maintenance, installation requirements, reject water, and product-specific performance must be considered.' }
                ],
                relatedSolutionClassSlugs: ['point-of-use-filtration']
            },
            {
                recordType: 'solution-class',
                slug: 'point-of-use-filtration',
                title: 'Point-of-use drinking-water filtration',
                domainSlug: 'water',
                publicationStatus: 'published',
                publicationLabel: 'Published editorial profile',
                accessStatus: 'No specific offer is currently published',
                commercialDisclosure: 'No seller, affiliate, sponsorship or distribution relationship is currently stated for this profile.',
                description: 'A household drinking-water filter selected by the contaminants it is independently certified to reduce, not by a generic “purification” promise.',
                problem: 'A defined drinking-water concern at one kitchen tap',
                whyIncluded: 'A point-of-use system keeps the decision focused on drinking and cooking water. Certification and a performance data sheet make specific reduction claims inspectable, while a local water report keeps the choice tied to an actual need.',
                materials: 'Product-specific filter media and housing; verify all wetted materials and replacement cartridges',
                priceState: {
                    status: 'unknown',
                    statement: 'No specific product or price is currently published'
                },
                availabilityState: {
                    status: 'unknown',
                    statement: 'No specific model or market availability is currently published'
                },
                updatedAt: '4 September 2026',
                evidence: [
                    { type: 'Public-health guidance', confidence: 'Established guidance', explanation: 'Filter choice should start with water-quality information, and the label should identify the substances a specific filter is designed to remove.', sourceTitle: 'CDC: About Choosing Home Water Filters', sourceUrl: 'https://www.cdc.gov/drinking-water/prevention/about-choosing-home-water-filters.html' },
                    { type: 'Technical standard', confidence: 'Product-specific certification', explanation: 'NSF/ANSI 42 addresses aesthetic effects; NSF/ANSI 53 addresses specified health-related reduction claims. Claims vary by product.', sourceTitle: 'NSF: Filtration Systems Standards 42, 53 and 401', sourceUrl: 'https://www.nsf.org/gb/en/knowledge-library/nsf-ansi-42-53-and-401-filtration-systems-standards' },
                    { type: 'Editorial assessment', confidence: 'Arvena interpretation', explanation: 'This Arvena editorial interpretation summarises the profile’s selection method and limitations. It is not an Arvena certification, formal verification, or approval or recommendation of a specific seller or model.', sourceTitle: 'Arvena methodology', sourceUrl: '#/methodology' }
                ],
                limitations: [
                    'This is an editorial product-type profile, not a product listing or an Arvena certification.',
                    'This profile describes a product type, not proof that every filter with similar media removes the same contaminants.',
                    'An NSF/ANSI standard number is not enough by itself; verify the exact reduction claims for the exact model.',
                    'Most pitcher and refrigerator carbon filters are primarily intended to improve taste and odour rather than remove microorganisms.',
                    'Incorrect installation or overdue cartridge replacement can reduce performance and allow microbial growth.',
                    'Local advisories, private-well risks, and immunocompromised users may require qualified, situation-specific guidance.'
                ],
                relatedGuideSlugs: ['clean-water-at-home']
            }
        ],
        offers: [],
        providers: [],
        protectedLegacyRequestContract: {
            solutionSlug: 'clean-water-at-home',
            productSlug: 'certified-point-of-use-filter',
            sourcePath: '#/request'
        }
    };

    window.ARVENA_DATA = deepFreeze(publicContent);
}());
