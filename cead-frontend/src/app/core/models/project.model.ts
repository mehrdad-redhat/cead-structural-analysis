export interface Project {
	_id?: number;
	name?: string;
	modifiedDate?: string;
	structures: StructureItem[];
}

export interface StructureItem {
  _id?: number;
  name?: string;
  thumbnail?: string;
  location?: string;
  type?: string;
  revision?: string;
  modifiedDate?: string;
}
