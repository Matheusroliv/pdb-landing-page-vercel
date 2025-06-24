export enum EducationLevelEnum {
  Cursinho = 'Cursinho',
  EnsinoInfantil = 'Ensino Infantil',
  EnsinoFundamental = 'Ensino Fundamental',
  EducacaoJovemAdultos = 'Educação de Jovens e Adultos',
  EnsinoMedio = 'Ensino Médio',
  EducacaoProfissional = 'Educação Profissional',
  Graduacao = 'Graduação',
  PosGraduacao = 'Pós-Graduação'
}

export enum sortType {
  A_Z = 'A-Z',
  Z_A = 'Z-A',
  BEST_RATING = 'BEST_RATING',
  MOST_COMPLAINTS = 'MOST_COMPLAINTS',
  NEXT_LOCATION = 'NEXT_LOCATION'
}

export interface InstitutionQuery {
  sort?: sortType;
  name?: string;
  cnpj?: string;
  zipCode?: string;
  city?: string;
  address?: string;
  state?: string;
  juridicName?: string;
  type?: string;
  academicOrganization?: string;
  openingdateBegin?: string;
  openingdateEnd?: string;
  rating?: number;
  coordinates?: [number, number];
  educationLevelSource?: EducationLevelEnum;
  acessibility?: string[];
  phone?: boolean;
  email?: boolean;
  site?: boolean;
  scholarshipPolicy?: string;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
}
export interface Student {
  name: string;
  city: string;
  photo: string;
  message: string;
  backgroundColor: string;
  rotation: string;
}
