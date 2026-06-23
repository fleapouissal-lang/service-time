export const servicesCatalog = {
  eyebrow: "Main services",
  title: "Choose a service and send your request",
  description:
    "Maintenance, mobile service, spare parts, towing, and more — pick a sub-option and submit one request form.",
  expandCategory: "Show sub-options",
  collapseCategory: "Hide sub-options",
  selectSubOption: "Choose a sub-option",
  selectPlaceholder: "Select a sub-option…",
  requestFormTitle: "Send your request",
  requestFormHint: "Fill in your details and we will contact you shortly.",
  loginRequiredNote:
    "Sign in with a client account to submit this request. Service type and details are filled in automatically.",
  fullRequestCta: "Full request with live tracking",
  openLink: "Continue",
  browseParts: "Browse spare parts store",
  trackExternal: "Track external orders",
  messagePrefix: "Service",
  categories: [
    {
      id: "general_maintenance",
      title: "General maintenance",
      description:
        "Periodic maintenance at our workshop — oil, brakes, AC, diagnostics, and more.",
      subOptions: [
        {
          id: "oil_change",
          label: "Oil & filter change",
          description: "Engine oil and filter replacement with a quick inspection.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "brake_service",
          label: "Brake inspection & service",
          description: "Pads, discs, and brake fluid check.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "ac_service",
          label: "AC service",
          description: "Air conditioning check, recharge, or repair.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "full_inspection",
          label: "Full vehicle inspection",
          description: "Comprehensive check before travel or purchase.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "battery_check",
          label: "Battery check & replacement",
          description: "Battery test and replacement at the workshop.",
          action: "full|periodic_maintenance|workshop_visit",
        },
      ],
    },
    {
      id: "mobile_maintenance",
      title: "Mobile maintenance",
      description:
        "A certified technician comes to your location anywhere in Riyadh.",
      subOptions: [
        {
          id: "mobile_oil",
          label: "Mobile oil change",
          description: "Oil and filter change at your home or office.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_diagnostics",
          label: "On-site diagnostics",
          description: "Computer diagnostics and fault reading at your location.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_battery",
          label: "Mobile battery service",
          description: "Battery test, jump start, or replacement on site.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
        {
          id: "mobile_ac",
          label: "Mobile AC service",
          description: "AC check and basic service at your location.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
      ],
    },
    {
      id: "spare_parts",
      title: "Spare parts request",
      description:
        "Order genuine or compatible parts — browse the store or send a custom request.",
      subOptions: [
        {
          id: "browse_store",
          label: "Browse spare parts catalog",
          description: "Search parts, add to cart, and order online.",
          action: "link|/spare-parts",
        },
        {
          id: "custom_part",
          label: "Custom part request",
          description: "Part not listed? Send details and we will source it.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "engine_parts",
          label: "Engine & mechanical parts",
          description: "Filters, belts, pumps, and engine components.",
          action: "full|periodic_maintenance|workshop_visit",
        },
        {
          id: "body_parts",
          label: "Body & exterior parts",
          description: "Bumpers, lights, mirrors, and body panels.",
          action: "full|periodic_maintenance|workshop_visit",
        },
      ],
    },
    {
      id: "flatbed",
      title: "Flatbed / towing",
      description:
        "Vehicle transport and recovery — city, highway, and accident scenes.",
      subOptions: [
        {
          id: "city_tow",
          label: "City towing",
          description: "Tow your vehicle within Riyadh.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "highway_tow",
          label: "Highway recovery",
          description: "Recovery and transport from highways and outer roads.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "accident_transport",
          label: "Accident scene transport",
          description: "Safe transport after a collision or immobilized vehicle.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "long_distance",
          label: "Inter-city transport",
          description: "Flatbed transport to another city or workshop.",
          action: "full|emergency|mobile_workshop",
        },
      ],
    },
    {
      id: "breakdown_accidents",
      title: "Breakdowns & accidents",
      description:
        "Roadside assistance and support when your car stops or after an incident.",
      subOptions: [
        {
          id: "roadside_breakdown",
          label: "Roadside breakdown",
          description: "General breakdown — we diagnose and repair on site when possible.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "jump_start",
          label: "Jump start",
          description: "Dead battery — quick jump start at your location.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "flat_tire",
          label: "Flat tire assistance",
          description: "Tire change or temporary repair on the road.",
          action: "full|emergency|mobile_workshop",
        },
        {
          id: "accident_support",
          label: "Accident support",
          description: "Guidance, towing coordination, and next-step assistance.",
          action: "full|emergency|mobile_workshop",
        },
      ],
    },
    {
      id: "external_tracking",
      title: "External order tracking",
      description:
        "Follow orders placed outside the platform or via a partner — sign in to track.",
      subOptions: [
        {
          id: "track_with_code",
          label: "Track with tracking code",
          description: "Enter the code sent via SMS or WhatsApp.",
          action: "link|/login?next=/client/track",
        },
        {
          id: "view_orders",
          label: "View my orders",
          description: "Sign in to see all your service and parts orders.",
          action: "link|/login?next=/client/orders",
        },
        {
          id: "external_inquiry",
          label: "Inquiry about external order",
          description: "Ask about an order placed via phone or a partner.",
          action: "full|periodic_maintenance|mobile_workshop",
        },
      ],
    },
  ],
} as const;
