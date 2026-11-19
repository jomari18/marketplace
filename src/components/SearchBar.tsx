import Image from "next/image";
import Form from "next/form";

type SearchBarProps = {
  search: string;
  category: string | undefined;
};

/**
 * Keyword search. A plain GET form: submitting it loads /?q=...,
 * so it works even before JavaScript loads, and results are shareable.
 */
export default function SearchBar({ search, category }: SearchBarProps) {
  return (
    <Form action="/" className="search" role="search" scroll={false}>
      <label htmlFor="search" className="visually-hidden">
        Search listings
      </label>
      <Image src="/icons/search.svg" alt="" width={20} height={20} className="search__icon" />
      <input
        id="search"
        name="q"
        type="search"
        defaultValue={search}
        placeholder="Search titles and descriptions"
        maxLength={60}
        className="input search__input"
      />
      {category && <input type="hidden" name="category" value={category} />}
      <button type="submit" className="button">
        Search
      </button>
    </Form>
  );
}
