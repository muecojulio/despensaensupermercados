"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

/** Accessible searchable select. Values are selected with the keyboard or touch. */
export default function SearchableCombobox({
  id,
  label,
  value,
  options = [],
  onChange,
  placeholder = "Escribe para buscar",
  freeSolo = false,
  disabled = false,
  autoFocus = false,
  openOnFocus = true,
  maxLength,
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = `${id}-opciones`;
  const statusId = `${id}-estado`;

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? (freeSolo ? String(value ?? "") : "");
  const filteredOptions = useMemo(() => {
    const term = normalizar(query.trim());
    if (!term) return options;
    return options.filter((option) => normalizar(option.label).includes(term));
  }, [options, query]);

  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  useEffect(() => {
    setActiveIndex(open && filteredOptions.length ? 0 : -1);
  }, [open, query, filteredOptions.length]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${id}-opcion-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id, open]);

  const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : null;

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
    setQuery(selectedLabel);
  }

  function selectOption(option) {
    if (!option) return;
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function toggleMenu() {
    if (disabled) return;
    if (open) {
      closeMenu();
      inputRef.current?.focus();
      return;
    }
    setQuery("");
    setOpen(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setQuery("");
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (!filteredOptions.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        const base = current < 0 ? (delta > 0 ? -1 : 0) : current;
        return (base + delta + filteredOptions.length) % filteredOptions.length;
      });
      return;
    }

    if (open && filteredOptions.length && (event.key === "Home" || event.key === "End")) {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : filteredOptions.length - 1);
      return;
    }

    if (event.key === "Enter") {
      if (open && activeOption) {
        event.preventDefault();
        selectOption(activeOption);
      } else if (freeSolo && query.trim()) {
        event.preventDefault();
        onChange(query.trim());
        closeMenu();
      } else if (!open) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    }
  }

  function handleBlur(event) {
    if (wrapperRef.current?.contains(event.relatedTarget)) return;
    window.setTimeout(() => {
      if (!wrapperRef.current?.contains(document.activeElement)) closeMenu();
    }, 0);
  }

  return (
    <div className="search-combobox" ref={wrapperRef} onBlurCapture={handleBlur}>
      {label ? <label className="field-label" htmlFor={id}>{label}</label> : null}
      <div className="combobox-control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeOption ? `${id}-opcion-${activeIndex}` : undefined}
          aria-describedby={open && !filteredOptions.length ? statusId : undefined}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          disabled={disabled}
          onFocus={() => {
            if (!openOnFocus) {
              inputRef.current?.select();
              return;
            }
            setQuery("");
            setOpen(true);
          }}
          onClick={() => {
            if (!openOnFocus && !open) {
              setQuery("");
              setOpen(true);
            }
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setOpen(true);
            if (freeSolo) onChange(nextQuery);
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="combobox-toggle"
          aria-label={`${open ? "Cerrar" : "Mostrar"} opciones de ${label || "la lista"}`}
          aria-expanded={open}
          aria-controls={listId}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMenu}
        >
          <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
        </button>
      </div>
      <div className="combobox-popover" hidden={!open}>
        <div id={listId} className="combobox-options" role="listbox" aria-label={`${label || "Opciones"} disponibles`}>
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-opcion-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-posinset={index + 1}
              aria-setsize={filteredOptions.length}
              className={[
                "combobox-option",
                index === activeIndex ? "is-active" : "",
                option.value === value ? "is-selected" : "",
              ].filter(Boolean).join(" ")}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {option.value === value ? <span className="combobox-check" aria-hidden="true">✓</span> : null}
            </div>
          ))}
        </div>
        {open && !filteredOptions.length ? (
          <p id={statusId} className="combobox-empty" role="status" aria-live="polite">
            No hay coincidencias{query.trim() ? ` para “${query.trim()}”` : ""}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
