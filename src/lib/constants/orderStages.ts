export interface OrderStage {
  id: string;
  name: string;
  description: string;
  defaultPercentage: number;
}

export const DEFAULT_ORDER_STAGES: OrderStage[] = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    description: 'Bespoke commission verified, client contract and initial advance deposit secured.',
    defaultPercentage: 10,
  },
  {
    id: 'design_measurements',
    name: 'Design & Measurements',
    description: 'Precision architectural schematics, CAD scaling, and room-specific dimensional calibration completed.',
    defaultPercentage: 20,
  },
  {
    id: 'material_selection',
    name: 'Material Selection',
    description: 'Hardwood lumber slabs, specialty veneers, marble, leather hides, and textiles hand-selected and quarantined.',
    defaultPercentage: 30,
  },
  {
    id: 'manufacturing_started',
    name: 'Manufacturing Started',
    description: 'Lumber dimensioned, precision milling initiated, and workshop master artisan assigned.',
    defaultPercentage: 40,
  },
  {
    id: 'frame_preparation',
    name: 'Frame Preparation',
    description: 'Kiln-dried beechwood / mahogany framework assembled with mortise-and-tenon and corner-blocked joinery.',
    defaultPercentage: 50,
  },
  {
    id: 'foam_upholstery',
    name: 'Foam & Upholstery',
    description: 'Multi-density high-resilience foam layered, goose down quilting laid, and hand-tailored fabric or leather fitted.',
    defaultPercentage: 65,
  },
  {
    id: 'polishing_finishing',
    name: 'Polishing & Finishing',
    description: 'Hand-rubbed organic wax, multi-coat Italian polyurethane or French lacquer polished to museum lustres.',
    defaultPercentage: 75,
  },
  {
    id: 'quality_inspection',
    name: 'Quality Inspection',
    description: 'Comprehensive 40-point structural integrity, seam tension, finish smoothness, and dimensional audit cleared.',
    defaultPercentage: 85,
  },
  {
    id: 'ready_for_delivery',
    name: 'Ready for Delivery',
    description: 'Packaging in custom wooden crates, heavy-duty protective fleece wrap, and white-glove transport scheduling.',
    defaultPercentage: 92,
  },
  {
    id: 'out_for_delivery',
    name: 'Out for Delivery',
    description: 'Dispatched onboard Saad dedicated white-glove transit vehicle en route to client private residence.',
    defaultPercentage: 98,
  },
  {
    id: 'successfully_delivered',
    name: 'Successfully Delivered',
    description: 'White-glove uncrating, room-of-choice positioning, client inspection signoff, and debris removal concluded.',
    defaultPercentage: 100,
  },
];

