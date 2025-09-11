enum BulkDataType {
  DEFAULT = 'default_cards',
  ORACLE = 'oracle_cards',
  ALL = 'all_cards',
  RULING = 'rulings',
  UNIQUE_ARTWORK = 'unique_artwork',
}

export interface ScryfallBulkData {
  object: string;
  id: string;
  type: BulkDataType;
  updated_at: string;
  uri: string;
  name: string;
  description: string;
  size: number;
  download_uri: string;
  content_type: string;
  content_encoding: string;
}
