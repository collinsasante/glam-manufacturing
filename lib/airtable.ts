import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || '');

export const tables = {
  suppliers: base('Suppliers'),
  rawMaterials: base('Raw Materials Catalog'),
  stockMovement: base('Stock Movement'),
  generalWarehouse: base('General Warehouse'),
  stockTransfer: base('Stock Transfer'),
  oyarifaRetailWarehouse: base('Oyarifa Retail Warehouse'),
  finishedGoodsWarehouse: base('Finished Goods Warehouse'),
  azBulkWarehouse: base('A-Z Bulk Warehouse'),
  rawMaterialWarehouse: base('Raw Material Warehouse'),
  manufacturing: base('Manufacturing'),
  teamMembers: base('Team Members'),
  deliveries: base('Deliveries'),
  deliveryStops: base('Delivery Stops'),
  riders: base('Riders'),
};

export default base;
