.PHONY: run

run:
	@echo "http://localhost:8088/raineystreet.games/"
	@cd .. && python3 -m http.server 8088
