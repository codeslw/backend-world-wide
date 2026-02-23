import { Injectable } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { CountriesService } from '../countries/countries.service';
import { ProgramsService } from '../programs/programs.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class CatalogService {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly citiesService: CitiesService,
    private readonly programsService: ProgramsService,
  ) {}

  async getCountries(lang: string = 'uz', paginationDto?: PaginationDto) {
    return this.countriesService.findAll(lang, paginationDto);
  }

  async getCountry(code: number, lang: string = 'uz') {
    return this.countriesService.findOne(code, lang);
  }

  async getCities(
    lang: string = 'uz',
    page: number = 1,
    limit: number = 10,
    countryCode?: number,
  ) {
    return this.citiesService.findAll(lang, page, limit, countryCode);
  }

  async getCity(id: string, lang: string = 'uz') {
    return this.citiesService.findOne(id, lang);
  }

  async getPrograms(
    parentId?: string,
    lang: string = 'uz',
    paginationDto?: PaginationDto,
  ) {
    return this.programsService.findAll(parentId, lang, paginationDto);
  }

  async getProgram(id: string, lang: string = 'uz') {
    return this.programsService.findOne(id, lang);
  }

  async getRootPrograms(lang: string = 'uz', paginationDto?: PaginationDto) {
    // Only get programs that don't have a parent (root programs)
    return this.programsService.findAll(null, lang, paginationDto);
  }

  async getLanguages() {
    return [
      'Afrikaans',
      'Albanian',
      'Amharic',
      'Arabic',
      'Armenian',
      'Azerbaijani',
      'Basque',
      'Belarusian',
      'Bengali',
      'Bosnian',
      'Bulgarian',
      'Catalan',
      'Cebuano',
      'Chinese',
      'Corsican',
      'Croatian',
      'Czech',
      'Danish',
      'Dutch',
      'English',
      'Esperanto',
      'Estonian',
      'Filipino',
      'Finnish',
      'French',
      'Frisian',
      'Galician',
      'Georgian',
      'German',
      'Greek',
      'Gujarati',
      'Haitian Creole',
      'Hausa',
      'Hawaiian',
      'Hebrew',
      'Hindi',
      'Hmong',
      'Hungarian',
      'Icelandic',
      'Igbo',
      'Indonesian',
      'Irish',
      'Italian',
      'Japanese',
      'Javanese',
      'Kannada',
      'Kazakh',
      'Khmer',
      'Korean',
      'Kurdish',
      'Kyrgyz',
      'Lao',
      'Latin',
      'Latvian',
      'Lithuanian',
      'Luxembourgish',
      'Macedonian',
      'Malagasy',
      'Malay',
      'Malayalam',
      'Maltese',
      'Maori',
      'Marathi',
      'Mongolian',
      'Myanmar (Burmese)',
      'Nepali',
      'Norwegian',
      'Oriya',
      'Pashto',
      'Persian',
      'Polish',
      'Portuguese',
      'Punjabi',
      'Romanian',
      'Russian',
      'Samoan',
      'Scots Gaelic',
      'Serbian',
      'Sesotho',
      'Shona',
      'Sindhi',
      'Sinhala',
      'Slovak',
      'Slovenian',
      'Somali',
      'Spanish',
      'Sundanese',
      'Swahili',
      'Swedish',
      'Tajik',
      'Tamil',
      'Tatar',
      'Telugu',
      'Thai',
      'Turkish',
      'Turkmen',
      'Ukrainian',
      'Urdu',
      'Uzbek',
      'Vietnamese',
      'Welsh',
      'Xhosa',
      'Yiddish',
      'Yoruba',
      'Zulu',
    ].sort();
  }
}
