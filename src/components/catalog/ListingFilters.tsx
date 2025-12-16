import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SlidersHorizontal, X, MapPin, DollarSign, Calendar, Tag } from 'lucide-react';

export interface ListingFiltersState {
  state: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minAge: string;
  maxAge: string;
  tags: string[];
}

interface FiltersProps {
  filters: ListingFiltersState;
  onFiltersChange: (filters: ListingFiltersState) => void;
  availableTags: { id: string; name: string; slug: string }[];
}

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas',
  'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo',
  'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná',
  'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina',
  'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins'
};

export function ListingFilters({ filters, onFiltersChange, availableTags }: FiltersProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof ListingFiltersState, value: string | string[]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(t => t !== tagId)
      : [...filters.tags, tagId];
    updateFilter('tags', newTags);
  };

  const clearFilters = () => {
    onFiltersChange({
      state: 'all',
      city: '',
      minPrice: '',
      maxPrice: '',
      minAge: '',
      maxAge: '',
      tags: [],
    });
    setOpen(false);
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.state && filters.state !== 'all') count++;
    if (filters.city) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minAge || filters.maxAge) count++;
    count += filters.tags.length;
    return count;
  };

  const hasActiveFilters = countActiveFilters() > 0;

  const FilterContent = () => (
    <div className="space-y-2">
      <Accordion type="multiple" defaultValue={['location', 'price', 'age', 'categories']} className="w-full">
        {/* Location filters */}
        <AccordionItem value="location">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Localização
              {(filters.state !== 'all' || filters.city) && (
                <Badge variant="secondary" className="ml-auto mr-2 h-5 px-1.5 text-xs">
                  {(filters.state !== 'all' ? 1 : 0) + (filters.city ? 1 : 0)}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>
                      {state} - {STATE_NAMES[state]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Cidade</Label>
              <Input
                placeholder="Digite a cidade..."
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
                className="h-9"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price filters */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Preço
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="ml-auto mr-2 h-5 px-1.5 text-xs">1</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="h-9 pl-8"
                  />
                </div>
              </div>
            </div>
            {/* Quick price buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[100, 200, 300, 500].map(price => (
                <Button
                  key={price}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => updateFilter('maxPrice', price.toString())}
                >
                  Até R${price}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Age filters */}
        <AccordionItem value="age">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Idade
              {(filters.minAge || filters.maxAge) && (
                <Badge variant="secondary" className="ml-auto mr-2 h-5 px-1.5 text-xs">1</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mínima</Label>
                <Input
                  type="number"
                  placeholder="18"
                  min="18"
                  value={filters.minAge}
                  onChange={(e) => updateFilter('minAge', e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Máxima</Label>
                <Input
                  type="number"
                  placeholder="∞"
                  min="18"
                  value={filters.maxAge}
                  onChange={(e) => updateFilter('maxAge', e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            {/* Quick age buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '18-25', min: '18', max: '25' },
                { label: '25-35', min: '25', max: '35' },
                { label: '35-45', min: '35', max: '45' },
                { label: '45+', min: '45', max: '' },
              ].map(range => (
                <Button
                  key={range.label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    updateFilter('minAge', range.min);
                    updateFilter('maxAge', range.max);
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category/Tags filters */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium hover:no-underline">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Categorias
              {filters.tags.length > 0 && (
                <Badge variant="secondary" className="ml-auto mr-2 h-5 px-1.5 text-xs">
                  {filters.tags.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2">
            {availableTags.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTags.map(tag => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.id}
                      checked={filters.tags.includes(tag.id)}
                      onCheckedChange={() => toggleTag(tag.id)}
                    />
                    <label
                      htmlFor={tag.id}
                      className="text-sm leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tag.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma categoria disponível</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full mt-4" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Limpar {countActiveFilters()} filtro{countActiveFilters() > 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {countActiveFilters()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtrar anúncios</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop filters */}
      <div className="hidden lg:block p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </h3>
          {hasActiveFilters && (
            <Badge variant="secondary">{countActiveFilters()}</Badge>
          )}
        </div>
        <FilterContent />
      </div>
    </>
  );
}
